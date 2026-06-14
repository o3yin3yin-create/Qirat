const express = require('express');
const path = require('path');
const cheerio = require('cheerio');
// sqlite3 required dynamically for local sqlite development only
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable JSON parsing middleware
app.use(express.json());

let db;
const isPg = !!process.env.DATABASE_URL;

if (isPg) {
    const { Pool } = require('pg');
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    console.log('Connected to PostgreSQL database.');

    pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT,
            phone TEXT UNIQUE,
            national_id TEXT UNIQUE,
            password_hash TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `).catch(err => console.error("Error creating users table in PG:", err));

    pool.query(`
        CREATE TABLE IF NOT EXISTS portfolios (
            user_id INTEGER PRIMARY KEY,
            data TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `).catch(err => console.error("Error creating portfolios table in PG:", err));

    db = {
        serialize: (fn) => fn(),
        run: function(sql, params, cb) {
            if (typeof params === 'function') {
                cb = params;
                params = [];
            }
            let index = 1;
            let convertedSql = sql.replace(/\?/g, () => `$${index++}`);
            
            if (convertedSql.includes('CREATE TABLE')) {
                if (cb) cb(null);
                return;
            }

            const isInsert = convertedSql.trim().toUpperCase().startsWith('INSERT');
            if (isInsert && !convertedSql.toUpperCase().includes('RETURNING')) {
                convertedSql += ' RETURNING id';
            }

            pool.query(convertedSql, params, (err, res) => {
                if (err) {
                    if (cb) cb(err);
                    return;
                }
                const context = {};
                if (isInsert && res.rows && res.rows.length > 0) {
                    context.lastID = res.rows[0].id;
                }
                if (cb) cb.call(context, null);
            });
        },
        get: function(sql, params, cb) {
            if (typeof params === 'function') {
                cb = params;
                params = [];
            }
            let index = 1;
            const convertedSql = sql.replace(/\?/g, () => `$${index++}`);
            pool.query(convertedSql, params, (err, res) => {
                if (err) {
                    if (cb) cb(err);
                    return;
                }
                const row = res.rows && res.rows.length > 0 ? res.rows[0] : null;
                if (cb) cb(null, row);
            });
        },
        all: function(sql, params, cb) {
            if (typeof params === 'function') {
                cb = params;
                params = [];
            }
            let index = 1;
            const convertedSql = sql.replace(/\?/g, () => `$${index++}`);
            pool.query(convertedSql, params, (err, res) => {
                if (err) {
                    if (cb) cb(err);
                    return;
                }
                if (cb) cb(null, res.rows || []);
            });
        }
    };
} else {
    if (process.env.VERCEL) {
        console.error('CRITICAL: DATABASE_URL is not set on Vercel! PostgreSQL connection is required.');
        db = {
            serialize: (fn) => fn(),
            run: (sql, params, cb) => {
                const callback = typeof params === 'function' ? params : cb;
                if (callback) callback(new Error('Database not configured. Please set DATABASE_URL in Vercel settings.'));
            },
            get: (sql, params, cb) => {
                const callback = typeof params === 'function' ? params : cb;
                if (callback) callback(new Error('Database not configured. Please set DATABASE_URL in Vercel settings.'));
            },
            all: (sql, params, cb) => {
                const callback = typeof params === 'function' ? params : cb;
                if (callback) callback(new Error('Database not configured. Please set DATABASE_URL in Vercel settings.'));
            }
        };
    } else {
        // Initialize SQLite database
        const sqlite3 = require('sqlite3').verbose();
        db = new sqlite3.Database(path.join(__dirname, 'dahaby.db'), (err) => {
            if (err) console.error('Error opening database:', err);
            else console.log('Connected to SQLite database.');
        });

        db.serialize(() => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT,
                    phone TEXT UNIQUE,
                    national_id TEXT UNIQUE,
                    password_hash TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);
            db.run(`
                CREATE TABLE IF NOT EXISTS portfolios (
                    user_id INTEGER PRIMARY KEY,
                    data TEXT,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                )
            `);
        });
    }
}

// Crypto Helpers
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

function verifyPassword(password, storedPassword) {
    const [salt, originalHash] = storedPassword.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
}

// JWT Helpers
const JWT_SECRET = 'dahaby_egypt_secret_key_2026';

function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
}

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.status(401).json({ error: 'مطلوب تسجيل الدخول' });
    
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ error: 'جلسة غير صالحة أو منتهية' });
        req.userId = decoded.userId;
        next();
    });
}

const defaultPortfolio = {
    activePortfolioId: 'default',
    portfolios: {
        'default': {
            name: 'حقيبة الادخار الأساسية',
            holdings: [],
            goalWeight: 50,
            monthlySavings: 5000
        }
    }
};

// Serve static files from the 'public' directory with custom cache control for service-worker
app.use((req, res, next) => {
    if (req.url === '/service-worker.js') {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
    next();
});
app.use(express.static(path.join(__dirname, 'public')));

// --- AUTHENTICATION API ENDPOINTS ---

// Register
app.post('/api/auth/register', (req, res) => {
    const { name, phone, nationalId, password } = req.body;
    
    if (!name || !phone || !nationalId || !password) {
        return res.status(400).json({ error: 'يرجى إدخال جميع البيانات المطلوبة بما فيها الاسم' });
    }
    
    const nameClean = name.trim();
    const phoneClean = phone.trim();
    const nationalIdClean = nationalId.trim();
    
    if (nameClean.length < 2) {
        return res.status(400).json({ error: 'الاسم يجب أن يتكون من حرفين على الأقل' });
    }
    if (!/^\d{11}$/.test(phoneClean)) {
        return res.status(400).json({ error: 'رقم الهاتف يجب أن يتكون من 11 رقماً' });
    }
    if (!/^\d{14}$/.test(nationalIdClean)) {
        return res.status(400).json({ error: 'الرقم القومي يجب أن يتكون من 14 رقماً' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 6 أحرف أو أرقام على الأقل' });
    }
    
    const pwdHash = hashPassword(password);
    
    db.get('SELECT id FROM users WHERE phone = ? OR national_id = ?', [phoneClean, nationalIdClean], (err, row) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (row) {
            return res.status(400).json({ error: 'رقم الهاتف أو الرقم القومي مسجل بالفعل' });
        }
        
        db.run('INSERT INTO users (name, phone, national_id, password_hash) VALUES (?, ?, ?, ?)', [nameClean, phoneClean, nationalIdClean, pwdHash], function(err) {
            if (err) return res.status(500).json({ error: 'خطأ أثناء إنشاء الحساب' });
            
            const userId = this.lastID;
            
            db.run('INSERT INTO portfolios (user_id, data) VALUES (?, ?)', [userId, JSON.stringify(defaultPortfolio)], (err) => {
                if (err) console.error('Error creating default portfolio for user:', userId);
                
                const token = generateToken(userId);
                res.json({ token, name: nameClean, message: 'تم إنشاء الحساب بنجاح' });
            });
        });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body;
    
    if (!phone || !password) {
        return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف وكلمة المرور' });
    }
    
    const phoneClean = phone.trim();
    
    db.get('SELECT id, name, password_hash FROM users WHERE phone = ?', [phoneClean], (err, user) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (!user || !verifyPassword(password, user.password_hash)) {
            return res.status(401).json({ error: 'رقم الهاتف أو كلمة المرور غير صحيحة' });
        }
        
        const token = generateToken(user.id);
        res.json({ token, name: user.name, message: 'تم تسجيل الدخول بنجاح' });
    });
});

// Forgot Password Reset
app.post('/api/auth/reset-password-forgot', (req, res) => {
    const { phone, nationalId, goldWeight, newPassword } = req.body;
    
    if (!phone || !nationalId || goldWeight === undefined || !newPassword) {
        return res.status(400).json({ error: 'يرجى إدخال جميع البيانات المطلوبة للتحقق وتعيين كلمة المرور الجديدة' });
    }
    
    const phoneClean = phone.trim();
    const nationalIdClean = nationalId.trim();
    const enteredWeight = parseFloat(goldWeight);
    
    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف أو أرقام على الأقل' });
    }
    
    db.get('SELECT id, password_hash FROM users WHERE phone = ? AND national_id = ?', [phoneClean, nationalIdClean], (err, user) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (!user) {
            return res.status(400).json({ error: 'رقم الهاتف أو الرقم القومي غير متطابق مع بياناتنا' });
        }
        
        // Fetch user's portfolio to calculate gold weight
        db.get('SELECT data FROM portfolios WHERE user_id = ?', [user.id], (err, portRow) => {
            let rawWeight = 0;
            let eq21Weight = 0;
            if (portRow) {
                try {
                    const data = JSON.parse(portRow.data);
                    const activeId = data.activePortfolioId || 'default';
                    const p = data.portfolios && data.portfolios[activeId];
                    if (p && Array.isArray(p.holdings)) {
                        p.holdings.forEach(item => {
                            const w = parseFloat(item.weight) || 0;
                            rawWeight += w;
                            
                            let mult = 1;
                            if (item.type === 'coin') {
                                eq21Weight += w * 8;
                            } else {
                                const karat = item.karat;
                                if (karat === '24k') mult = 24 / 21;
                                else if (karat === '22k') mult = 22 / 21;
                                else if (karat === '18k') mult = 18 / 21;
                                else if (karat === '14k') mult = 14 / 21;
                                eq21Weight += w * mult;
                            }
                        });
                    }
                } catch (e) {}
            }
            
            // Validate weight: must match raw weight or eq21Weight within 0.05 margin
            const diffRaw = Math.abs(rawWeight - enteredWeight);
            const diffEq = Math.abs(eq21Weight - enteredWeight);
            
            if (diffRaw > 0.05 && diffEq > 0.05) {
                return res.status(400).json({ error: 'جرامات الذهب المدخلة غير صحيحة، يرجى كتابة الوزن الفعلي للمحفظة للتحقق' });
            }
            
            // Verification succeeded! Update password
            const pwdHash = hashPassword(newPassword);
            db.run('UPDATE users SET password_hash = ? WHERE id = ?', [pwdHash, user.id], (err) => {
                if (err) return res.status(500).json({ error: 'خطأ أثناء تحديث كلمة المرور الجديدة' });
                res.json({ success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح، يمكنك تسجيل الدخول بها الآن' });
            });
        });
    });
});

// Get User Profile
app.get('/api/user/profile', authenticateToken, (req, res) => {
    db.get('SELECT name, phone, national_id FROM users WHERE id = ?', [req.userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        res.json(user);
    });
});

// --- PORTFOLIO CLOUD SYNC ENDPOINTS ---

// Get Portfolio
app.get('/api/portfolio', authenticateToken, (req, res) => {
    db.get('SELECT data FROM portfolios WHERE user_id = ?', [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'خطأ في قاعدة البيانات' });
        if (!row) {
            return res.json(defaultPortfolio);
        }
        try {
            res.json(JSON.parse(row.data));
        } catch (e) {
            res.json(defaultPortfolio);
        }
    });
});

// Sync/Save Portfolio
app.post('/api/portfolio/sync', authenticateToken, (req, res) => {
    const portfolioData = req.body;
    
    if (!portfolioData) {
        return res.status(400).json({ error: 'بيانات المحفظة فارغة' });
    }
    
    db.run(
        'INSERT INTO portfolios (user_id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = CURRENT_TIMESTAMP',
        [req.userId, JSON.stringify(portfolioData)],
        (err) => {
            if (err) {
                console.error('Sync error:', err);
                return res.status(500).json({ error: 'خطأ أثناء مزامنة البيانات' });
            }
            res.json({ success: true, message: 'تمت المزامنة بنجاح' });
        }
    );
});

// In-memory cache
let cachedGoldData = null;
let lastCacheTime = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Fallback data in case scraping fails completely
const getFallbackData = (errorReason) => {
    return {
        prices: {
            "24k": { "sell": 7130, "buy": 7075 },
            "21k": { "sell": 6240, "buy": 6190 },
            "18k": { "sell": 5350, "buy": 5305 },
            "14k": { "sell": 4160, "buy": 4125 },
            "coin": { "sell": 49920, "buy": 49520 },
            "ounce_egp": { "sell": 221810, "buy": 220035 },
            "ounce_usd": 4218.34
        },
        usdGoldDollar: 52.58,
        usdBankDollar: 51.88,
        nisabZakat: 606050,
        updatedAtText: "أسعار استرشادية (مؤقتة)",
        updatedAtTime: new Date().toISOString(),
        isFallback: true,
        fallbackReason: errorReason
    };
};

async function fetchGoldPrices() {
    const url = "https://egypt.gold-price-today.com/";
    const headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "ar,en;q=0.9"
    };

    try {
        const response = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        const $ = cheerio.load(html);

        const result = {
            prices: {},
            usdGoldDollar: null,
            usdBankDollar: null,
            nisabZakat: null,
            updatedAtText: '',
            updatedAtTime: null,
            isFallback: false
        };

        // Parse last update time
        const timeEl = $('time[datetime]');
        if (timeEl.length > 0) {
            result.updatedAtTime = timeEl.first().attr('datetime');
            result.updatedAtText = timeEl.first().text().trim();
        } else {
            const anyTime = $('time');
            if (anyTime.length > 0) {
                result.updatedAtText = anyTime.first().text().trim();
            }
        }

        // Parse rows
        $('table tbody tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length === 0) return;

            const label = $(cells[0]).text().replace(/\s+/g, ' ').trim();

            if (cells.length >= 2) {
                const sellText = $(cells[1]).text().replace(/\s+/g, ' ').trim();
                const buyText = cells.length >= 3 ? $(cells[2]).text().replace(/\s+/g, ' ').trim() : sellText;

                const cleanNumber = (str) => {
                    const matches = str.match(/[\d,.]+/);
                    if (!matches) return 0;
                    return parseFloat(matches[0].replace(/,/g, ''));
                };

                const sellVal = cleanNumber(sellText);
                const buyVal = cleanNumber(buyText);

                if (label.includes('نصاب الزكاة')) {
                    result.nisabZakat = sellVal;
                } else if (label.includes('عيار 24')) {
                    result.prices['24k'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('عيار 21')) {
                    result.prices['21k'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('عيار 18')) {
                    result.prices['18k'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('عيار 14')) {
                    result.prices['14k'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('الجنيه الذهب')) {
                    result.prices['coin'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('الأونصة بالجنيه')) {
                    result.prices['ounce_egp'] = { sell: sellVal, buy: buyVal };
                } else if (label.includes('الأونصة بالدولار')) {
                    result.prices['ounce_usd'] = sellVal;
                } else if (label.includes('دولار الصاغة')) {
                    const goldSpan = $(cells[1]).find('.text-amber-700, .text-amber-900');
                    const bankSpan = $(cells[1]).find('.text-emerald-700, .text-emerald-900');
                    if (goldSpan.length > 0) result.usdGoldDollar = cleanNumber(goldSpan.text());
                    if (bankSpan.length > 0) result.usdBankDollar = cleanNumber(bankSpan.text());

                    // Fallback regex parsing if spans classes change
                    if (!result.usdGoldDollar || !result.usdBankDollar) {
                        const matches = sellText.match(/[\d.]+/g);
                        if (matches && matches.length >= 2) {
                            result.usdGoldDollar = parseFloat(matches[0]);
                            result.usdBankDollar = parseFloat(matches[1]);
                        }
                    }
                }
            }
        });

        // Basic validation: ensure we parsed at least the main karats
        if (!result.prices['24k'] || !result.prices['21k'] || !result.prices['18k']) {
            throw new Error("Missing key parsed values (24k/21k/18k)");
        }

        return result;
    } catch (error) {
        console.error("Scraping failed:", error.message);
        throw error;
    }
}

// API Endpoint
app.get('/api/gold-prices', async (req, res) => {
    const now = Date.now();
    
    // Check cache
    if (cachedGoldData && (now - lastCacheTime < CACHE_DURATION)) {
        return res.json(cachedGoldData);
    }
    
    try {
        const freshData = await fetchGoldPrices();
        cachedGoldData = freshData;
        lastCacheTime = now;
        res.json(freshData);
    } catch (err) {
        // Return cache even if expired if we can't scrape new data
        if (cachedGoldData) {
            console.log("Serving expired cache due to fetch failure");
            return res.json({
                ...cachedGoldData,
                isStale: true,
                staleAge: Math.round((now - lastCacheTime) / 1000)
            });
        }
        // Fallback to hardcoded mock data
        res.json(getFallbackData(err.message));
    }
});

// --- ADMIN / IT DASHBOARD ENDPOINTS ---

// Admin/IT authentication middleware (Only phone 01050442007 is admin)
function authenticateAdmin(req, res, next) {
    authenticateToken(req, res, () => {
        db.get('SELECT phone FROM users WHERE id = ?', [req.userId], (err, user) => {
            if (err || !user || user.phone !== '01050442007') {
                return res.status(403).json({ error: 'غير مصرح لك بالوصول لصلاحيات الـ IT' });
            }
            next();
        });
    });
}

// Get all registered users list
app.get('/api/admin/users', authenticateAdmin, (req, res) => {
    db.all('SELECT id, name, phone, national_id, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'خطأ في جلب قائمة المستخدمين' });
        res.json(rows);
    });
});

// Get admin stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    db.get('SELECT COUNT(*) as count FROM users', [], (err, userRow) => {
        if (err) return res.status(500).json({ error: 'خطأ في جلب إحصائيات المستخدمين' });
        
        db.all('SELECT data FROM portfolios', [], (err, portfolioRows) => {
            if (err) return res.status(500).json({ error: 'خطأ في جلب إحصائيات المحافظ' });
            
            let totalUsers = userRow.count;
            let totalPortfolios = portfolioRows.length;
            let totalGoldWeight = 0;
            
            portfolioRows.forEach(row => {
                try {
                    const data = JSON.parse(row.data);
                    const activeId = data.activePortfolioId || 'default';
                    const p = data.portfolios && data.portfolios[activeId];
                    if (p && Array.isArray(p.holdings)) {
                        p.holdings.forEach(item => {
                            totalGoldWeight += parseFloat(item.weight) || 0;
                        });
                    }
                } catch (e) {}
            });
            
            res.json({
                totalUsers,
                totalPortfolios,
                totalGoldWeight: parseFloat(totalGoldWeight.toFixed(2))
            });
        });
    });
});

// Search user by phone number
app.get('/api/admin/users/search', authenticateAdmin, (req, res) => {
    const { phone } = req.query;
    if (!phone) {
        return res.status(400).json({ error: 'يرجى إدخال رقم الهاتف للبحث' });
    }
    
    db.get('SELECT id, name, phone, national_id, created_at FROM users WHERE phone = ?', [phone.trim()], (err, user) => {
        if (err) return res.status(500).json({ error: 'خطأ أثناء البحث عن المستخدم' });
        if (!user) return res.status(404).json({ error: 'المستخدم غير موجود' });
        
        db.get('SELECT data FROM portfolios WHERE user_id = ?', [user.id], (err, portRow) => {
            let goldWeight = 0;
            let eq21Weight = 0;
            if (portRow) {
                try {
                    const data = JSON.parse(portRow.data);
                    const activeId = data.activePortfolioId || 'default';
                    const p = data.portfolios && data.portfolios[activeId];
                    if (p && Array.isArray(p.holdings)) {
                        p.holdings.forEach(item => {
                            const w = parseFloat(item.weight) || 0;
                            goldWeight += w;
                            
                            let mult = 1;
                            if (item.type === 'coin') {
                                eq21Weight += w * 8;
                            } else {
                                const karat = item.karat;
                                if (karat === '24k') mult = 24 / 21;
                                else if (karat === '22k') mult = 22 / 21;
                                else if (karat === '18k') mult = 18 / 21;
                                else if (karat === '14k') mult = 14 / 21;
                                eq21Weight += w * mult;
                            }
                        });
                    }
                } catch (e) {}
            }
            
            res.json({
                id: user.id,
                name: user.name,
                phone: user.phone,
                nationalId: user.national_id,
                createdAt: user.created_at,
                goldWeight: parseFloat(goldWeight.toFixed(2)),
                eq21Weight: parseFloat(eq21Weight.toFixed(2))
            });
        });
    });
});

// Admin reset password of user
app.post('/api/admin/users/reset-password', authenticateAdmin, (req, res) => {
    const { userId, newPassword } = req.body;
    if (!userId || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'بيانات غير مكتملة أو كلمة المرور قصيرة جداً (الحد الأدنى 6 أحرف)' });
    }
    
    const pwdHash = hashPassword(newPassword);
    db.run('UPDATE users SET password_hash = ? WHERE id = ?', [pwdHash, userId], function(err) {
        if (err) return res.status(500).json({ error: 'خطأ أثناء تحديث كلمة المرور' });
        if (this.changes === 0) return res.status(404).json({ error: 'المستخدم غير موجود' });
        
        res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    });
});

// Start server (only if not running on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

module.exports = app;
