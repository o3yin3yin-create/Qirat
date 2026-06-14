// --- CRYPTOGRAPHY HELPERS (Web Crypto API - AES-GCM) ---
let userPasscode = null;
let portfoliosData = null; // Decrypted portfolios database
let activePortfolioId = 'default';
let currentPinInput = '';
let goldPrices = null;
let currentTheme = 'dark';
let currentLanguage = localStorage.getItem('qirat_lang') || 'ar';

const TRANSLATIONS = {
    'asset-alloc-title': { ar: 'توزيع الأصول في المحفظة', en: 'Asset Allocation' },
    'auth-already-have-account-span': { ar: 'لديك حساب بالفعل؟', en: 'Already have an account?' },
    'auth-back-to-login': { ar: 'العودة لتسجيل الدخول', en: 'Back to Login' },
    'auth-confirm-reg-btn': { ar: 'تسجيل الحساب وتأمينه', en: 'Register & Secure Account' },
    'auth-forgot-desc': { ar: 'أثبت هويتك باستخدام بيانات الحساب المسجلة مسبقاً لاستعادة حسابك.', en: 'Verify your identity using register profile credentials.' },
    'auth-forgot-link': { ar: 'نسيت كلمة المرور؟', en: 'Forgot password?' },
    'auth-forgot-newpw-label': { ar: 'كلمة المرور الجديدة', en: 'New Password' },
    'auth-forgot-phone-label': { ar: 'رقم الهاتف المسجل بالحساب', en: 'Registered Phone Number' },
    'auth-forgot-submit-btn': { ar: 'استعادة وتحديث كلمة المرور', en: 'Reset & Update Password' },
    'auth-forgot-title': { ar: 'استعادة كلمة المرور', en: 'Password Recovery' },
    'auth-forgot-weight-label': { ar: 'إجمالي جرامات الذهب في حسابك (تقريباً)', en: 'Total Gold Weight in Account' },
    'auth-fullname-label': { ar: 'الاسم بالكامل', en: 'Full Name' },
    'auth-login-btn': { ar: 'تسجيل الدخول', en: 'Sign In' },
    'auth-guest-btn': { ar: 'الدخول كـ زائر (بدون حساب)', en: 'Enter as Guest (No Account)' },
    'auth-login-desc': { ar: 'سجل دخولك لمزامنة محفظتك وحفظ ممتلكاتك بشكل آمن وتلقائي.', en: 'Sign in to your account to securely sync and backup your portfolio.' },
    'auth-login-title': { ar: 'مرحباً بك في قيراط', en: 'Welcome back' },
    'auth-logout-btn': { ar: 'تسجيل الخروج', en: 'Sign Out' },
    'auth-national-id-label': { ar: 'الرقم القومي', en: 'National ID' },
    'auth-no-account-span': { ar: 'ليس لديك حساب؟', en: 'Don\'t have an account?' },
    'auth-password-label': { ar: 'كلمة المرور', en: 'Password' },
    'auth-phone-label': { ar: 'رقم الهاتف المحمول', en: 'Mobile Number' },
    'auth-reg-desc': { ar: 'انضم إلى قيراط لإدارة وتتبع مدخراتك الذهبية بكفاءة.', en: 'Join Qirat to manage and track your gold assets efficiently.' },
    'auth-reg-title': { ar: 'إنشاء حساب جديد', en: 'Create a New Account' },
    'auth-register-link': { ar: 'سجل حساباً جديداً الآن', en: 'Register now' },
    'auth-support-btn': { ar: 'الدعم الفني للمنصة', en: 'Contact Technical Support' },
    'auth-support-desc': { ar: 'في حال عدم تذكر البيانات أو مواجهة صعوبة، تواصل مباشرة مع المطور:', en: 'If you cannot verify your credentials, contact our support team.' },
    'auth-support-instagram': { ar: 'حساب الإنستجرام', en: 'Instagram Profile' },
    'auth-support-phone1': { ar: 'تواصل عبر الهاتف', en: 'Call Support' },
    'auth-support-phone2': { ar: 'تواصل واتساب', en: 'Support WhatsApp' },
    'auth-support-title': { ar: 'مركز الدعم الفني والمساعدة المباشرة', en: 'Technical Support Assistance' },
    'badge-gram': { ar: 'جرام', en: 'g' },
    'brand-btc': { ar: 'BTC (كاش باك كامل)', en: 'BTC (Full Cashback)' },
    'brand-other': { ar: 'شركات أخرى (كاش باك جزئي)', en: 'Other Company (Partial Cashback)' },
    'brand-selema': { ar: 'سليمة (كاش باك كامل)', en: 'Selema (Full Cashback)' },
    'breakdown-modal-title': { ar: '⚖️ تفصيل أوزان الذهب الفعلي', en: '⚖️ Detailed Gold Weights' },
    'breakdown-24k': { ar: 'عيار 24 (سبائك):', en: '24K (Bullion):' },
    'breakdown-21k': { ar: 'عيار 21 (مشغولات):', en: '21K (Jewelry):' },
    'breakdown-18k': { ar: 'عيار 18:', en: '18K:' },
    'breakdown-14k': { ar: 'عيار 14:', en: '14K:' },
    'breakdown-coins': { ar: 'جنيهات الذهب (عدد):', en: 'Gold Coins (count):' },
    'breakdown-bars-title': { ar: 'تفصيل فئات السبائك:', en: 'Bullion Bars Breakdown:' },
    'breakdown-eq24': { ar: 'الوزن الإجمالي (معادل ع24):', en: 'Total Weight (24K equiv):' },
    'breakdown-eq21': { ar: 'الوزن الإجمالي (معادل ع21):', en: 'Total Weight (21K equiv):' },
    'calc-b-amount-label': { ar: 'الميزانية المتوفرة بالجنيه', en: 'Available Budget' },
    'calc-b-option-bar': { ar: 'سبائك ذهبية مغلفة (مصنعية ~80 ج.م)', en: 'Wrapped Bullion Bars (Workmanship ~80 EGP)' },
    'calc-b-option-coin': { ar: 'جنيهات ذهب مغلفة (مصنعية ~100 ج.م)', en: 'Wrapped Gold Coins (Workmanship ~100 EGP)' },
    'calc-b-option-local': { ar: 'مشغولات ذهبية محلية (مصنعية ~180 ج.م)', en: 'Local Gold Jewelry (Workmanship ~180 EGP)' },
    'calc-b-option-luxury': { ar: 'مشغولات فاخرة ومستوردة (مصنعية ~300 ج.م)', en: 'Luxury/Imported Gold (Workmanship ~300 EGP)' },
    'calc-b-workmanship-label': { ar: 'تقدير مصنعية الشراء للجرام', en: 'Estimated Purchase Workmanship/g' },
    'calc-btn-budget': { ar: 'حاسبة الميزانية العكسية', en: 'Reverse Budget' },
    'calc-btn-purchase': { ar: 'حاسبة شراء ذهب جديد', en: 'New Purchase' },
    'calc-btn-selling': { ar: 'حاسبة بيع وتصفية', en: 'Sell & Liquidate' },
    'calc-btn-swap': { ar: 'حاسبة مبادلة وتبديل', en: 'Gold Swap' },
    'calc-btn-zakat': { ar: 'حاسبة الزكاة والصدقة', en: 'Zakat & Charity' },
    'calc-p-karat-label': { ar: 'العيار المراد شراؤه', en: 'Target Karat' },
    'calc-p-res-final-label': { ar: 'سعر شراء الجرام النهائي بالمصنعية والضريبة:', en: 'Estimated Price/g (with Workmanship & Taxes):' },
    'calc-p-res-pure-label': { ar: 'سعر جرام الذهب الصافي بالصاغة اليوم:', en: 'Live Spot Price:' },
    'calc-p-res-total-label': { ar: 'إجمالي سعر فاتورة الشراء المقدر:', en: 'Total Invoice Value:' },
    'calc-p-tax-label': { ar: 'الضريبة والدمغة (%)', en: 'Taxes & Stamps (%)' },
    'calc-p-weight-label': { ar: 'الوزن بالجرام', en: 'Weight (Grams)' },
    'calc-s-brand-label': { ar: 'الشركة المصنعة (كاش باك)', en: 'Manufacturer (Cashback Refund)' },
    'calc-s-deduction-label': { ar: 'خصم فصوص وهالك', en: 'Stones & Scrap Deduction' },
    'calc-s-option-bar': { ar: 'سبيكة مغلفة (BTC، سليمة..)', en: 'Wrapped Bullion Bar (BTC, Selema..)' },
    'calc-s-option-coin': { ar: 'جنيه ذهب مغلف', en: 'Wrapped Gold Coin' },
    'calc-s-option-scrap': { ar: 'مشغولات قديمة / ذهب كسر', en: 'Old Jewelry / Scrap Gold' },
    'calc-s-res-cashback-label': { ar: 'قيمة الكاش باك المسترد المقدرة:', en: 'Estimated Cashback Refund:' },
    'calc-s-res-pure-label': { ar: 'سعر الشراء الصافي بالصاغة اليوم:', en: 'Spot Buying Price:' },
    'calc-s-res-total-label': { ar: 'إجمالي القيمة النقدية المستلمة:', en: 'Total Cash Received:' },
    'calc-s-res-weight-label': { ar: 'الوزن الصافي المستحق للقيمة:', en: 'Net Eligible Weight:' },
    'calc-s-type-label': { ar: 'نوع الذهب المباع للصائغ', en: 'Gold Type Sold to Jeweler' },
    'calc-s-weight-label': { ar: 'الوزن الإجمالي (جرام)', en: 'Total Weight (grams)' },
    'calc-selector-label': { ar: 'اختر نوع العملية الحسابية:', en: 'Select Calculation Type:' },
    'calc-swap-new-heading': { ar: 'الذهب الجديد (المشتري من الصائغ)', en: 'New Gold (Purchased from Jeweler)' },
    'calc-swap-new-karat-label': { ar: 'العيار الجديد', en: 'New Karat' },
    'calc-swap-new-weight-label': { ar: 'الوزن الجديد (جرام)', en: 'New Weight (Grams)' },
    'calc-swap-old-ded-label': { ar: 'نسبة هالك وفصوص (%)', en: 'Stones & Scrap Deduction (%)' },
    'calc-swap-old-heading': { ar: 'الذهب القديم (المباع للصائغ)', en: 'Old Gold (Sold to Jeweler)' },
    'calc-swap-old-karat-label': { ar: 'العيار القديم', en: 'Old Karat' },
    'calc-swap-old-weight-label': { ar: 'الوزن القديم (جرام)', en: 'Old Weight (Grams)' },
    'calc-swap-res-old-label': { ar: 'قيمة الذهب القديم ككسر (البيع للصائغ):', en: 'Old Gold Scrap Value (Jeweler buys):' },
    'calc-swap-res-new-label': { ar: 'قيمة الذهب الجديد بالمصنعية والضريبة (الشراء):', en: 'New Gold Cost (Jeweler sells):' },
    'calc-swap-res-diff-label': { ar: 'الفرق النقدي الواجب دفعه للصائغ:', en: 'Cash Difference to Pay to Jeweler:' },
    'calc-z-charity-base-label': { ar: 'حساب الصدقة الطوعية من:', en: 'Calculate voluntary charity from:' },
    'calc-z-charity-pct-label': { ar: 'نسبة الصدقة:', en: 'Charity Rate:' },
    'calc-z-charity-profit': { ar: 'صافي أرباح المحفظة', en: 'Net Portfolio Profits' },
    'calc-z-charity-total': { ar: 'إجمالي قيمة الذهب', en: 'Total Gold Value' },
    'calc-z-import-btn': { ar: 'استيراد الأوزان تلقائيًا من محفظتي', en: 'Import weights automatically from my portfolio' },
    'calc-z-opt-invest': { ar: '<b>للاستثمار والادخار:</b> (سبائك، جنيهات، كسر) - <i>تجب فيه الزكاة إجماعاً متى بلغ النصاب.</i>', en: '<b>For Savings & Investment:</b> (Bars, coins, scrap) - <i>Zakat is obligatory once it reaches nisab.</i>' },
    'calc-z-opt-jewelry': { ar: '<b>للزينة والاستخدام الشخصي:</b> (حلي نسائية للارتداء) - <i>خلافية، والأحوط وجوب زكاتها.</i>', en: '<b>For Personal Decoration:</b> (Jewelry for wear) - <i>Subject to debate, Zakat is recommended as precaution.</i>' },
    'calc-z-purpose-label': { ar: 'الغرض من اقتناء الذهب:', en: 'Purpose of owning the gold:' },
    'calc-z-quote-cite': { ar: 'سورة البقرة - الآية 245', en: 'Surah Al-Baqarah - Verse 245' },
    'calc-z-quote-text': { ar: '"مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً ۚ وَاللَّهُ يَقْبِضُ وَيَبْسُطُ وَإِليْهِ تُرْجَعُونَ"', en: '"Who is it that would loan Allah a goodly loan so He will multiply it for him many times over?"' },
    'calc-z-res-charity-label': { ar: 'الصدقة الطوعية المخصصة:', en: 'Voluntary Charity:' },
    'calc-z-res-desc': { ar: 'تجب الزكاة بمقدار 2.5% على الذهب الادخاري متى بلغ النصاب وحال عليه الحول.', en: 'Zakat is 2.5% on savings gold held for a lunar year if it reaches the Nisab.' },
    'calc-z-res-due-label': { ar: 'الزكاة المستحقة (2.5%):', en: 'Due Zakat (2.5%):' },
    'calc-z-res-equiv-label': { ar: 'الوزن المعادل لعيار 24:', en: 'Equivalent 24K Weight:' },
    'calc-z-res-nisab-label': { ar: 'النصاب الشرعي (85 جم ع24):', en: 'Shariah Nisab (85g 24K):' },
    'calc-z-res-status-label': { ar: 'حالة بلوغ النصاب:', en: 'Nisab Status:' },
    'calc-z-res-total-label': { ar: 'إجمالي القيمة الخاضعة للزكاة:', en: 'Total Eligible Gold Value:' },
    'calc-z-status-false': { ar: 'لم يبلغ النصاب', en: 'Did not reach Nisab' },
    'calc-z-w14-label': { ar: 'عيار 14 (جم)', en: '14K Weight (g)' },
    'calc-z-w18-label': { ar: 'عيار 18 (جم)', en: '18K Weight (g)' },
    'calc-z-w21-label': { ar: 'عيار 21 (جم)', en: '21K Weight (g)' },
    'calc-z-w24-label': { ar: 'عيار 24 (جم)', en: '24K Weight (g)' },
    'chart-period-text': { ar: 'السعر بالجنيه المصري للجرام', en: 'Price per Gram in EGP' },
    'chart-title-main': { ar: 'حركة سعر جرام عيار 21 خلال آخر 7 أيام', en: '21K Gold Price Flow (Last 7 Days)' },
    'currency-egp': { ar: 'ج.م', en: 'EGP' },
    'footer-brand-desc': { ar: 'منصة تفاعلية آمنة 100% لإدارة وحساب استثماراتك الذهبية بمصر. حسابك محمي بالكامل ويتم مزامنة ممتلكاتك سحابياً للوصول إليها من أي جهاز.', en: 'A 100% secure interactive platform to manage and calculate your gold investments in Egypt. Your account is fully protected, and assets are synchronized in the cloud for access from any device.' },
    'footer-brand-title': { ar: 'قيراط', en: 'Qirat' },
    'footer-copyright': { ar: '© 2026 قيراط. جميع الحقوق محفوظة.', en: '© 2026 Qirat. All rights reserved.' },
    'footer-developed-by': { ar: 'Developed by', en: 'Developed by' },
    'footer-guide-btn': { ar: 'دليل استخدام منصة قيراط', en: 'Qirat User Guide & Documentation' },
    'footer-maker-note': { ar: 'صنع بحب لحماية وخدمة مدخراتك', en: 'Made with love to protect and serve your savings' },
    'goal-badge-gram': { ar: 'جم ع21', en: 'g 21K' },
    'goal-details-desc': { ar: 'أدخل وزن الهدف الادخاري المطلوب محسوباً بـ جرام عيار 21.', en: 'Enter your goal in equivalent 21K grams.' },
    'goal-details-title': { ar: 'هدف الادخار المستهدف', en: 'Target Savings Goal' },
    'goal-edit-btn': { ar: 'تعديل هدف المحفظة', en: 'Modify Goal' },
    'goal-modal-title': { ar: 'تعديل إعدادات الهدف والقدرة الادخارية', en: 'Edit Savings Goal Settings' },
    'goal-monthly-label': { ar: 'القدرة الادخارية الشهرية (بالجنيه)', en: 'Estimated monthly savings' },
    'goal-save-btn': { ar: 'حفظ التعديلات', en: 'Save Settings' },
    'goal-sim-default': { ar: 'الادخار: 0 ج.م/شهر', en: 'Savings: 0 EGP/mo' },
    'goal-simulator-header': { ar: 'محاكي الأهداف الادخارية والقدرة المالية', en: 'Savings Goal Simulator' },
    'goal-target-default': { ar: 'الهدف: 0 جم', en: 'Goal: 0g' },
    'goal-weight-label': { ar: 'الوزن المستهدف', en: 'Target weight' },
    'guide-modal-title': { ar: '📖 دليل استخدام منصة قيراط', en: '📖 Qirat Platform User Guide' },
    'guide-sec1-desc': { ar: 'منصة <b>قيراط (Qirat)</b> هي مستشارك الاستثماري والادخاري الأول للذهب في مصر. تم تصميمها لتوفير أدوات دقيقة لحساب مدخراتك الذهبية ومتابعتها لحظة بلحظة وبشكل آمن تماماً، مع دعم كامل للتشغيل دون اتصال بالإنترنت (Offline Mode) وحفظ البيانات محلياً وسحابياً.', en: '<b>Qirat</b> is your gold investment and savings consultant in Egypt. It provides secure tools to calculate and track your gold assets live. It features cloud synchronization, offline capability, and a suite of smart calculators.' },
    'guide-sec1-title': { ar: '✨ نظرة عامة عن المنصة', en: '✨ Platform Overview' },
    'guide-sec2-desc': { ar: 'يعرض هذا القسم أسعار الذهب الفورية في مصر لجميع الأعيرة (24، 21، 18، 14) بالإضافة إلى مؤشرات هامة مثل دولار الصاغة والدولار البنكي ونسبة الفجوة بينهما وسعر الأونصة العالمي. يوضح المخطط البياني حركة سعر عيار 21 خلال آخر 7 أيام لتحديد الوقت الأنسب للشراء أو البيع.', en: 'Displays live gold prices in Egypt for all karats (24, 21, 18, 14), plus key indicators like Gold Dollar, Bank Dollar, and the spread gap. The line chart shows the 21K price over the last 7 days to help you determine the best time to buy or sell.' },
    'guide-sec2-title': { ar: '📈 1. الأسعار والشارت (تحديث مباشر)', en: '📈 1. Spot Prices & Line Chart' },
    'guide-sec3-bullet1': { ar: '<b>تعدد المحافظ:</b> يمكنك إنشاء محافظ متعددة لتنظيم مدخراتك بشكل منفصل (مثلاً: محفظة شخصية، محفظة للأولاد).', en: '<b>Multiple Portfolios:</b> Create separate portfolios to organize savings (e.g., Personal, Kids).' },
    'guide-sec3-bullet2': { ar: '<b>تسجيل العمليات:</b> يدعم تسجيل السبائك، الجنيهات، المشغولات والذهب القديم ومتابعتها.', en: '<b>Record Transactions:</b> Log bars, coins, jewelry, and scrap gold.' },
    'guide-sec3-bullet3': { ar: '<b>إدخال سعر الشراء:</b> يمكنك إدخال المبلغ الإجمالي الذي دفعته، أو تركه فارغاً للذهب القديم الذي لا تتذكر سعره، وسيقوم البرنامج بحساب إحصائياتك بذكاء.', en: '<b>Optional Cost Input:</b> Leave the purchase price empty for old gold of unknown cost, and the system adjusts stats automatically.' },
    'guide-sec3-bullet4': { ar: '<b>محاكي الأهداف الادخارية:</b> حدد هدفاً بالجرامات وسيقوم البرنامج بحساب الوقت اللازم للوصول إليه بناءً على قدرتك الادخارية الشهرية.', en: '<b>Goal Simulator:</b> Set a target weight, and the app calculates the time to reach it based on your monthly savings capacity.' },
    'guide-sec3-title': { ar: '💼 2. إدارة المحفظة الاستثمارية', en: '💼 2. Portfolio Management' },
    'guide-sec4-bullet1': { ar: '<b>حاسبة الشراء:</b> لحساب التكلفة الإجمالية لشراء ذهب جديد شاملة سعر الذهب الخام، والمصنعية للجرام.', en: '<b>Purchase Calculator:</b> Calculate final cost including raw price and workmanship.' },
    'guide-sec4-bullet2': { ar: '<b>حاسبة البيع والتصفية:</b> لحساب المبلغ المستلم عند البيع للصائغ بناءً على أسعار السوق والعيار والوزن.', en: '<b>Selling Calculator:</b> Calculate exact payout when selling gold based on current market prices, karat, and weight.' },
    'guide-sec4-bullet3': { ar: '<b>حاسبة المبادلة:</b> لمبادلة ذهب قديم بآخر جديد ومعرفة الفارق المالي الواجب دفعه أو استلامه بدقة.', en: '<b>Gold Swap Calculator:</b> Swap old gold for new pieces with accurate cost difference calculations.' },
    'guide-sec4-bullet4': { ar: '<b>حاسبة الزكاة والصدقة:</b> لحساب النصاب الشرعي لذهبك (ما يعادل 85 جرام عيار 24) وتحديد قيمة زكاة المال الواجبة (2.5%) مع إمكانية حساب صدقة طوعية مخصصة.', en: '<b>Zakat Calculator:</b> Find if your gold reaches the Shariah Nisab (85g 24K) and calculate the 2.5% due Zakat and charity.' },
    'guide-sec4-bullet5': { ar: '<b>حاسبة الميزانية العكسية:</b> أدخل ميزانيتك بالجنيه وسيقترح عليك البرنامج أفضل خيارات الشراء المتاحة (سبائك، جنيهات، مشغولات) مع توضيح الوزن المقدر والكسور المتبقية.', en: '<b>Reverse Budget Calculator:</b> Enter your budget in EGP, and the app suggests the best combination of bars, coins, or jewelry.' },
    'guide-sec4-desc': { ar: 'تضم الحاسبة 5 أدوات فرعية متطورة:', en: 'Features 5 advanced tools:' },
    'guide-sec4-title': { ar: '🧮 3. الحاسبة الذكية الموحدة', en: '🧮 3. Smart Unified Calculator' },
    'holdings-empty-state': { ar: 'المحفظة خالية، سجل عملية شراء لتتبع مدخراتك.', en: 'Portfolio is empty, record a purchase to track your savings.' },
    'holdings-th-buyprice': { ar: 'إجمالي سعر الشراء', en: 'Total Buy Price' },
    'holdings-th-delete': { ar: 'الإجراءات', en: 'Actions' },
    'holdings-th-karat': { ar: 'نوع الممتلكات والعيار', en: 'Type / Karat' },
    'holdings-th-profit': { ar: 'الأرباح والخسائر', en: 'Profit / Loss' },
    'holdings-th-spotval': { ar: 'القيمة الحالية', en: 'Current Value' },
    'holdings-th-weight': { ar: 'الوزن الإجمالي', en: 'Total Weight' },
    'holdings-title': { ar: 'بيان ممتلكات المحفظة الذهبية تفصيلياً', en: 'Assets & Transactions Details' },
    'logo-subtitle': { ar: 'المستشار الفني والادخاري للذهب', en: 'Your Gold Investment & Savings Consultant' },
    'logo-title': { ar: 'قيراط', en: 'Qirat' },
    'port-active-label': { ar: 'المحفظة النشطة', en: 'Active Portfolio' },
    'port-add-gold-btn': { ar: 'إضافة ذهب جديد للمحفظة', en: 'Add Gold / Transaction' },
    'port-dca-label': { ar: 'متوسط سعر الشراء للجرام (عيار 21)', en: 'Avg Gold Purchase Price/g (21K)' },
    'port-dca-sub': { ar: 'محسوب فقط للعمليات معلومة التكلفة', en: 'Based on purchases with known cost' },
    'port-profit-label': { ar: 'إجمالي الأرباح والخسائر', en: 'Total Profit / Loss' },
    'port-roi-default': { ar: 'العائد الاستثماري', en: 'ROI' },
    'port-total-value-label': { ar: 'إجمالي القيمة الحالية للمحفظة', en: 'Total Portfolio Value' },
    'port-weight-label': { ar: 'إجمالي الوزن معادل عيار 24 (اضغط للتفاصيل)', en: 'Total Gold Weight 24K equiv (click for details)' },
    'prof-eq21-label': { ar: '🏆 وزن مكافئ (عيار 21):', en: '🏆 Equivalent 21K Weight:' },
    'prof-gold-label': { ar: '⚖️ إجمالي الذهب الفعلي:', en: '⚖️ Total Gold Weight:' },
    'prof-modal-title': { ar: 'بيانات الحساب والمدخرات السريعة', en: 'Quick Profile Information' },
    'prof-name-label': { ar: '👤 الاسم:', en: '👤 Name:' },
    'prof-natid-label': { ar: '💳 الرقم القومي:', en: '💳 National ID:' },
    'prof-phone-label': { ar: '📞 رقم الهاتف:', en: '📞 Phone:' },
    'quick-guide-tip1-desc': { ar: 'احرص على شراء السبائك لأن مصنعيتها أقل مقارنة بالمشغولات الذهبية.', en: 'Buy bullion bars as they have lower workmanship fees compared to jewelry.' },
    'quick-guide-tip1-title': { ar: 'السبائك أولاً:', en: 'Bullion Bars First:' },
    'quick-guide-tip2-desc': { ar: 'يزن 8 جرامات عيار 21 وهو خيار رائع لحفظ المدخرات المتوسطة وتسييلها بسرعة.', en: 'Weighs 8 grams 21K. A great choice for medium-sized savings.' },
    'quick-guide-tip2-title': { ar: 'الجنيه الذهب:', en: 'Gold Coin:' },
    'quick-guide-tip3-desc': { ar: 'تجنب المشغولات الفنية لغرض الادخار، فالصائغ يشتريها بوزنها الصافي كـ "ذهب كسر".', en: 'Avoid complex jewelry for savings; jewelers buy it back as scrap gold.' },
    'quick-guide-tip3-title': { ar: 'المصنعية الضائعة:', en: 'Jewelry Losses:' },
    'quick-guide-tip4-desc': { ar: 'اختر دائماً الشركات والورش المعتمدة لضمان العيار والوزن والدقة.', en: 'Always choose certified brands to ensure correct karat, weight, and precision.' },
    'quick-guide-tip4-title': { ar: 'الشركات المعتمدة:', en: 'Certified Brands:' },
    'quick-guide-title': { ar: 'نصائح استثمارية هامة للمدخرين', en: 'Practical Tips for Gold Savers' },
    'status-live': { ar: 'تحديث لحظي', en: 'Live Update' },
    'tab-admin': { ar: 'التحكم', en: 'IT Dashboard' },
    'tab-calculators': { ar: 'الحاسبة', en: 'Calculator' },
    'tab-portfolio': { ar: 'المحفظة', en: 'Portfolio' },
    'tab-prices': { ar: 'الأسعار', en: 'Prices' },
    'ticker-bank-dollar': { ar: 'الدولار البنكي', en: 'Bank Dollar' },
    'ticker-gap': { ar: 'الفجوة', en: 'Gap' },
    'ticker-gold-dollar': { ar: 'دولار الصاغة', en: 'Gold Dollar' },
    'ticker-last-update': { ar: 'آخر تحديث', en: 'Last Update' },
    'ticker-loading': { ar: 'جاري تحديث أسعار الصاغة...', en: 'Loading live market rates...' },
    'ticker-ounce': { ar: 'الأونصة عالمياً', en: 'Global Ounce' },
    'ticker-title': { ar: 'مؤشرات أسواق الذهب في مصر', en: 'Live Market Rates' },
    'tx-brand-btc': { ar: 'BTC (كاش باك كامل)', en: 'BTC (Full Cashback)' },
    'tx-brand-label': { ar: 'الشركة المصنعة', en: 'Manufacturer' },
    'tx-brand-master': { ar: 'ماستر (كاش باك كامل)', en: 'Master (Full Cashback)' },
    'tx-brand-other': { ar: 'شركات أخرى (كاش باك جزئي)', en: 'Other Company (Partial Cashback)' },
    'tx-brand-selema': { ar: 'سليمة (كاش باك كامل)', en: 'Selema (Full Cashback)' },
    'tx-karat-14': { ar: 'عيار 14', en: '14K' },
    'tx-karat-18': { ar: 'عيار 18', en: '18K' },
    'tx-karat-21': { ar: 'عيار 21', en: '21K' },
    'tx-karat-24': { ar: 'عيار 24', en: '24K' },
    'tx-karat-label': { ar: 'العيار', en: 'Karat' },
    'tx-modal-title': { ar: 'إضافة عملية جديدة للمحفظة', en: 'Add New Transaction' },
    'tx-option-bar': { ar: 'سبيكة ذهبية', en: 'Bullion Bar' },
    'tx-option-coin': { ar: 'جنيه ذهب', en: 'Gold Coin' },
    'tx-option-jewelry': { ar: 'مشغولات ذهبية', en: 'Jewelry' },
    'tx-option-scrap': { ar: 'ذهب كسر / قديم', en: 'Scrap / Old Gold' },
    'tx-price-label': { ar: 'إجمالي سعر الشراء المدفوع بالكامل (اختياري)', en: 'Total Purchased Price Paid (Optional)' },
    'tx-qty-label': { ar: 'الكمية (العدد)', en: 'Quantity (Count)' },
    'tx-save-btn': { ar: 'حفظ وإضافة العملية', en: 'Save Transaction' },
    'tx-type-label': { ar: 'تصنيف الذهب', en: 'Asset Type' },
    'tx-weight-label': { ar: 'الوزن بالجرام (أو عدد الجنيهات)', en: 'Weight (Grams)' },
    'tx-workmanship-label': { ar: 'المصنعية للجرام (بالجنيه)', en: 'Workmanship per gram (EGP)' },
    'unit-grams': { ar: 'جرام', en: 'g' },
    'unit-pct': { ar: '%', en: '%' },
    
    // Placeholders
    'auth-forgot-newpw-placeholder': { ar: 'اختر الباسورد الجديد (6 أحرف/أرقام كحد أدنى)', en: 'New passcode (min 6 chars)' },
    'auth-forgot-weight-placeholder': { ar: 'مثال: 15.5', en: 'E.g. 15.5' },
    'auth-fullname-placeholder': { ar: 'أدخل اسمك الثلاثي بالكامل', en: 'E.g. John Doe' },
    'auth-national-id-forgot-placeholder': { ar: 'أدخل الرقم القومي المسجل المكون من 14 رقماً', en: 'Enter 14-digit national ID' },
    'auth-national-id-placeholder': { ar: 'أدخل الرقم القومي المكون من 14 رقماً', en: 'Enter 14-digit national ID' },
    'auth-password-placeholder': { ar: 'أدخل كلمة المرور الخاصة بك', en: 'Enter your password' },
    'auth-password-reg-placeholder': { ar: 'اختر كلمة مرور قوية', en: 'Create a secure passcode' },
    'auth-phone-placeholder': { ar: 'أدخل رقم هاتفك المكون من 11 رقماً', en: 'E.g. 010xxxxxxxx' },
    'auth-phone-reg-placeholder': { ar: 'أدخل رقم الهاتف المحمول', en: 'E.g. 010xxxxxxxx' },
    'tx-price-placeholder': { ar: 'اتركه فارغاً في حال الذهب القديم مجهول التكلفة', en: 'Leave empty if old / unknown cost' },
    
    // Alerts and Confirms
    'alert-login-error': { ar: 'رقم الهاتف أو كلمة المرور غير صحيحة', en: 'Invalid phone number or password.' },
    'alert-server-error': { ar: 'حدث خطأ أثناء الاتصال بالخادم، يرجى المحاولة لاحقاً', en: 'An error occurred while connecting to the server. Please try again later.' },
    'alert-register-success': { ar: 'تم إنشاء الحساب ومزامنة محفظتك بنجاح!', en: 'Account created and portfolio synced successfully!' },
    'alert-register-error': { ar: 'فشل إنشاء الحساب، يرجى التحقق من المدخلات', en: 'Failed to create account. Please check inputs.' },
    'alert-reset-success': { ar: 'تم تحديث كلمة المرور بنجاح، يرجى تسجيل الدخول بها الآن', en: 'Password updated successfully. Please login now.' },
    'alert-reset-error': { ar: 'خطأ في عملية التحقق', en: 'Verification error' },
    'alert-invalid-weight': { ar: 'يرجى إدخال وزن صحيح!', en: 'Please enter a valid weight!' },
    'alert-delete-last-portfolio': { ar: 'لا يمكنك حذف المحفظة الوحيدة المتبقية!', en: 'You cannot delete the only remaining portfolio!' },
    'alert-enter-phone-search': { ar: 'يرجى إدخال رقم الهاتف للبحث', en: 'Please enter a phone number to search.' },
    'alert-user-not-found': { ar: 'المستخدم غير موجود', en: 'User not found' },
    'alert-admin-reset-success': { ar: 'تم تغيير كلمة المرور للمستخدم بنجاح!', en: 'User password updated successfully!' },
    'alert-admin-reset-error': { ar: 'فشل تغيير كلمة المرور', en: 'Failed to reset password' },
    'confirm-logout': { ar: 'هل أنت متأكد من تسجيل الخروج؟', en: 'Are you sure you want to sign out?' },
    'confirm-delete-portfolio': { ar: 'هل أنت متأكد من حذف محفظة "{name}"؟', en: 'Are you sure you want to delete portfolio "{name}"?' }
};

const CHARITY_QUOTES_EN = [
    {
        text: "Who is it that would loan Allah a goodly loan so He will multiply it for him many times over?",
        cite: "Surah Al-Baqarah - Verse 245"
    },
    {
        text: "The example of those who spend their wealth in the way of Allah is like a seed of grain which grows seven spikes; in each spike is a hundred grains. And Allah multiplies for whom He wills.",
        cite: "Surah Al-Baqarah - Verse 261"
    },
    {
        text: "Allah destroys interest and gives increase for charities. And Allah does not love every sinning disbeliever.",
        cite: "Surah Al-Baqarah - Verse 276"
    },
    {
        text: "Indeed, the men who practice charity and the women who practice charity and have loaned Allah a goodly loan - it will be multiplied for them, and they will have a noble reward.",
        cite: "Surah Al-Iron - Verse 18"
    },
    {
        text: "Charity does not decrease wealth, and Allah increases His servant in honor when they forgive.",
        cite: "Hadith Sharif - Sahih Muslim"
    },
    {
        text: "Good deeds protect from evil fates, and secret charity extinguishes the Lord's anger.",
        cite: "Hadith Sharif - Narrated by Al-Tabarani"
    },
    {
        text: "Guard yourselves against the Fire, even if by giving half a date-fruit in charity.",
        cite: "Hadith Sharif - Sahih Al-Bukhari & Muslim"
    }
];

const KARAT_LABELS = {
    '24k': 'عيار 24',
    '22k': 'عيار 22',
    '21k': 'عيار 21',
    '18k': 'عيار 18',
    '14k': 'عيار 14',
    'coin': 'جنيه ذهب'
};

const CHARITY_QUOTES = [
    {
        text: "مَّن ذَا الَّذِي يُقْرِضُ اللَّهَ قَرْضًا حَسَنًا فَيُضَاعِفَهُ لَهُ أَضْعَافًا كَثِيرَةً ۚ وَاللَّهُ يَقْبِضُ وَيَبْسُطُ وَإِلَيْهِ تُرْجَعُونَ",
        cite: "سورة البقرة - الآية 245"
    },
    {
        text: "مَّثَلُ الَّذِينَ يُنفِقُونَ أَمْوَالَهُمْ فِي سَبِيلِ اللَّهِ كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ فِي كُلِّ سُنبُلَةٍ مِّائَةُ حَبَّةٍ ۗ وَاللَّهُ يُضَاعِفُ لِمَن يَشَاءُ",
        cite: "سورة البقرة - الآية 261"
    },
    {
        text: "يَمْحَقُ اللَّهُ الرِّبَا وَيُرْبِي الصَّدَقَاتِ ۗ وَاللَّهُ لَا يُحِبُّ كُلَّ كَفَّارٍ أَثِيمٍ",
        cite: "سورة البقرة - الآية 276"
    },
    {
        text: "إِنَّ الْمُصَّدِّقِينَ وَالْمُصَّدِّقَاتِ وَأَقْرَضُوا اللَّهَ قَرْضًا حَسَنًا يُضَاعَفُ لَهُمْ وَلَهُمْ أَجْرٌ كَرِيمٌ",
        cite: "سورة الحديد - الآية 18"
    },
    {
        text: "مَا نَقَصَتْ صَدَقَةٌ مِنْ مَالٍ، وَمَا زَادَ اللَّهُ عَبْدًا بِعَفْوٍ إِلَّا عِزًّا",
        cite: "الحديث الشريف - صحيح مسلم"
    },
    {
        text: "صَنَائِعُ الْمَعْرُوفِ تَقِي مَصَارِعَ السُّوءِ، وَصَدَقَةُ السِّرِّ تُطْفِئُ غَضَبَ الرَّبِّ",
        cite: "الحديث الشريف - رواه الطبراني"
    },
    {
        text: "اتَّقُوا النَّارَ وَلَوْ بِشِقِّ تَمْرَةٍ",
        cite: "الحديث الشريف - صحيح البخاري ومسلم"
    }
];

async function deriveKey(passcode, salt) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(passcode),
        "PBKDF2",
        false,
        ["deriveKey"]
    );
    return crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: salt,
            iterations: 100000,
            hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
    );
}

// --- CLOUD AUTHENTICATION HELPERS ---
async function checkAuthStatus() {
    const token = localStorage.getItem('dahaby_jwt');
    const isGuest = localStorage.getItem('dahaby_is_guest') === 'true';
    const authOverlay = document.getElementById('auth-overlay');
    const userBadge = document.getElementById('user-badge');
    const userPhoneDisplay = document.getElementById('user-phone-display');

    if (!token && !isGuest) {
        if (authOverlay) authOverlay.classList.add('active');
        if (userBadge) userBadge.style.display = 'none';
        const adminTabBtn = document.getElementById('admin-tab-btn');
        if (adminTabBtn) adminTabBtn.style.display = 'none';
        return;
    }

    if (authOverlay) authOverlay.classList.remove('active');
    if (userBadge) userBadge.style.display = 'flex';
    
    if (isGuest) {
        const guestName = currentLanguage === 'en' ? 'Guest' : 'زائر';
        if (userPhoneDisplay) userPhoneDisplay.textContent = guestName;
        const adminTabBtn = document.getElementById('admin-tab-btn');
        if (adminTabBtn) adminTabBtn.style.display = 'none';
        
        // Load cache or default
        const cache = localStorage.getItem('dahaby_portfolio_cache');
        if (cache) {
            try {
                portfoliosData = JSON.parse(cache);
            } catch (e) {
                portfoliosData = {
                    activePortfolioId: 'default',
                    portfolios: {
                        'default': {
                            name: currentLanguage === 'en' ? 'Basic Savings Portfolio' : 'حقيبة الادخار الأساسية',
                            holdings: [],
                            goalWeight: 50,
                            monthlySavings: 5000
                        }
                    }
                };
            }
        } else {
            portfoliosData = {
                activePortfolioId: 'default',
                portfolios: {
                    'default': {
                        name: currentLanguage === 'en' ? 'Basic Savings Portfolio' : 'حقيبة الادخار الأساسية',
                        holdings: [],
                        goalWeight: 50,
                        monthlySavings: 5000
                    }
                }
            };
        }
        activePortfolioId = portfoliosData.activePortfolioId || 'default';
        renderPortfolioSelector();
        renderPortfolio();
        return;
    }

    const savedName = localStorage.getItem('dahaby_user_name') || localStorage.getItem('dahaby_user_phone') || 'مستثمر';
    let displayName = savedName;
    if (displayName && !/^\d+$/.test(displayName.trim())) {
        displayName = displayName.trim().split(/\s+/)[0];
    }
    if (userPhoneDisplay) userPhoneDisplay.textContent = displayName;

    const userPhone = localStorage.getItem('dahaby_user_phone');
    const adminTabBtn = document.getElementById('admin-tab-btn');
    if (userPhone === '01050442007') {
        if (adminTabBtn) adminTabBtn.style.display = 'flex';
        fetchAdminStats();
    } else {
        if (adminTabBtn) adminTabBtn.style.display = 'none';
    }

    // Fetch cloud portfolio
    await fetchPortfolio();
}

async function fetchPortfolio() {
    const token = localStorage.getItem('dahaby_jwt');
    if (!token) return;

    try {
        const response = await fetch('/api/portfolio', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            portfoliosData = await response.json();
            activePortfolioId = portfoliosData.activePortfolioId || 'default';
            
            // Save cache
            localStorage.setItem('dahaby_portfolio_cache', JSON.stringify(portfoliosData));
            
            renderPortfolioSelector();
            renderPortfolio();
        } else {
            throw new Error('Failed to fetch from server');
        }
    } catch (e) {
        console.warn('Could not fetch portfolio from server, using local cache:', e.message);
        const cache = localStorage.getItem('dahaby_portfolio_cache');
        if (cache) {
            portfoliosData = JSON.parse(cache);
            activePortfolioId = portfoliosData.activePortfolioId || 'default';
            renderPortfolioSelector();
            renderPortfolio();
        }
    }
}

window.toggleAuthForms = function(event, type) {
    if (event) event.preventDefault();
    const loginBox = document.getElementById('login-form-box');
    const registerBox = document.getElementById('register-form-box');
    const forgotBox = document.getElementById('forgot-form-box');
    
    if (loginBox) loginBox.style.display = 'none';
    if (registerBox) registerBox.style.display = 'none';
    if (forgotBox) forgotBox.style.display = 'none';
    
    if (type === 'register') {
        if (registerBox) registerBox.style.display = 'block';
    } else if (type === 'forgot') {
        if (forgotBox) forgotBox.style.display = 'block';
        const supportInfo = document.getElementById('support-info-box');
        if (supportInfo) supportInfo.style.display = 'none';
    } else {
        if (loginBox) loginBox.style.display = 'block';
    }
    if (window.lucide) window.lucide.createIcons();
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. PWA Register
    registerPWA();

    // Initialize Language
    applyLanguage(currentLanguage);
    setupLanguageToggle();

    // 2. Initialize icons
    if (window.lucide) window.lucide.createIcons();

    // 3. Tab controller
    initTabs();

    // 4. Load theme
    initTheme();

    // 5. Network status PWA PnP
    initNetworkStatus();

    // 6. Check Auth status
    checkAuthStatus();

    // 7. Fetch Prices
    fetchPrices();

    // 8. Event listeners
    setupThemeToggle();
    setupAuthListeners();
    setupModals();
    setupCalculators();
    setupPortfolioListeners();
    setupAdminListeners();
    setupTickerToggle();
});

// --- PWA REGISTRATION ---
function registerPWA() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js')
                .then(reg => console.log('SW Registered', reg.scope))
                .catch(err => console.error('SW Registration failed', err));
        });
    }
}

// --- NETWORK OFFLINE BADGE ---
function initNetworkStatus() {
    const updateStatus = () => {
        const badge = document.getElementById('network-status');
        const text = document.getElementById('network-status-text');
        if (!badge || !text) return;

        if (navigator.onLine) {
            badge.style.borderColor = 'rgba(0, 230, 118, 0.2)';
            badge.querySelector('.pulse-dot').style.backgroundColor = 'var(--success)';
            text.textContent = currentLanguage === 'en' ? 'Live Update' : 'تحديث لحظي';
        } else {
            badge.style.borderColor = 'rgba(255, 23, 68, 0.3)';
            badge.querySelector('.pulse-dot').style.backgroundColor = 'var(--danger)';
            text.textContent = currentLanguage === 'en' ? 'Offline Mode' : 'وضع الأوفلاين';
        }
    };

    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

// --- THEME MANAGEMENT ---
function initTheme() {
    const savedTheme = localStorage.getItem('dahaby_theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    const themeIcon = document.getElementById('theme-icon');
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'moon');
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        if (themeIcon) themeIcon.setAttribute('data-lucide', 'sun');
    }
    
    localStorage.setItem('dahaby_theme', theme);
    if (window.lucide) window.lucide.createIcons();
    
    if (goldPrices) {
        initPriceChart();
    }

    if (portfoliosData) {
        renderPortfolio();
    }
}

function setupThemeToggle() {
    const toggle = document.getElementById('btn-theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            setTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });
    }
}

// --- TABS CONTROLLER ---
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            
            tabButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });
            tabPanels.forEach(panel => panel.classList.remove('active'));

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');
            const targetPanel = document.getElementById(`panel-${tabId}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
            
            // Force redraw portfolio donut chart when switching tabs to ensure visible canvas has positive height
            if (tabId === 'portfolio') {
                setTimeout(() => {
                    renderPortfolio();
                }, 50);
            } else if (tabId === 'admin') {
                setTimeout(() => {
                    fetchAdminStats();
                }, 50);
            }
        });
    });
}

// --- CLOUD SYNC & AUTHENTICATION LISTENERS ---
async function saveEncryptedData() {
    if (!portfoliosData) return;
    
    // Save to local cache for offline use
    localStorage.setItem('dahaby_portfolio_cache', JSON.stringify(portfoliosData));
    
    const token = localStorage.getItem('dahaby_jwt');
    if (!token) return;

    try {
        const response = await fetch('/api/portfolio/sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(portfoliosData)
        });
        if (!response.ok) {
            throw new Error('Sync request failed');
        }
        console.log('Portfolio synced siphoned/cloud-side successfully.');
    } catch (e) {
        console.warn('Sync failed, using cached data locally:', e.message);
    }
}

function setupAuthListeners() {
    // Login form submit
    document.getElementById('auth-login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('login-phone').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('dahaby_jwt', data.token);
                localStorage.setItem('dahaby_user_phone', phone.trim());
                localStorage.setItem('dahaby_user_name', data.name || '');
                
                document.getElementById('auth-login-form').reset();
                await checkAuthStatus();
            } else {
                alert(data.error || TRANSLATIONS['alert-login-error'][currentLanguage]);
            }
        } catch (err) {
            alert(TRANSLATIONS['alert-server-error'][currentLanguage]);
        }
    });

    // Register form submit
    document.getElementById('auth-register-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const nationalId = document.getElementById('reg-national-id').value;
        const password = document.getElementById('reg-password').value;
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone, nationalId, password })
            });
            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('dahaby_jwt', data.token);
                localStorage.setItem('dahaby_user_phone', phone.trim());
                localStorage.setItem('dahaby_user_name', data.name || name.trim());
                
                document.getElementById('auth-register-form').reset();
                alert(TRANSLATIONS['alert-register-success'][currentLanguage]);
                await checkAuthStatus();
            } else {
                alert(data.error || TRANSLATIONS['alert-register-error'][currentLanguage]);
            }
        } catch (err) {
            alert(TRANSLATIONS['alert-server-error'][currentLanguage]);
        }
    });

    // Guest login click
    document.getElementById('btn-login-guest')?.addEventListener('click', async () => {
        localStorage.setItem('dahaby_is_guest', 'true');
        await checkAuthStatus();
    });

    // Logout button click
    document.getElementById('btn-logout')?.addEventListener('click', () => {
        if (confirm(TRANSLATIONS['confirm-logout'][currentLanguage])) {
            localStorage.removeItem('dahaby_jwt');
            localStorage.removeItem('dahaby_user_phone');
            localStorage.removeItem('dahaby_user_name');
            localStorage.removeItem('dahaby_portfolio_cache');
            localStorage.removeItem('dahaby_is_guest');
            
            portfoliosData = null;
            activePortfolioId = 'default';
            
            const select = document.getElementById('portfolio-selector');
            if (select) select.innerHTML = '';
            
            const list = document.getElementById('portfolio-holdings-list');
            if (list) list.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-muted">${currentLanguage === 'en' ? 'Please sign in first.' : 'الرجاء تسجيل الدخول أولاً.'}</td></tr>`;
            
            // Reset portfolio summary statistics
            const stats = ['port-total-value', 'port-total-profit', 'port-dca-average'];
            stats.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = currentLanguage === 'en' ? '0 EGP' : '0 ج.م';
            });
            const portWeight = document.getElementById('port-total-weight');
            if (portWeight) portWeight.textContent = '0.00';
            
            const adminTabBtn = document.getElementById('admin-tab-btn');
            if (adminTabBtn) adminTabBtn.style.display = 'none';
            
            const activeTab = document.querySelector('.tab-btn.active');
            if (activeTab && activeTab.getAttribute('data-tab') === 'admin') {
                const pricesTab = document.querySelector('.tab-btn[data-tab="prices"]');
                if (pricesTab) pricesTab.click();
            }

            // Close profile modal if open
            const profileModal = document.getElementById('modal-user-profile');
            if (profileModal) profileModal.classList.remove('active');

            checkAuthStatus();
        }
    });

    // Forgot password form submit
    document.getElementById('auth-forgot-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = document.getElementById('forgot-phone').value;
        const nationalId = document.getElementById('forgot-national-id').value;
        const goldWeight = document.getElementById('forgot-gold-weight').value;
        const newPassword = document.getElementById('forgot-new-password').value;
        
        try {
            const response = await fetch('/api/auth/reset-password-forgot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, nationalId, goldWeight, newPassword })
            });
            const data = await response.json();
            
            if (response.ok) {
                alert(data.message || TRANSLATIONS['alert-reset-success'][currentLanguage]);
                document.getElementById('auth-forgot-form').reset();
                toggleAuthForms(null, 'login');
            } else {
                alert(data.error || TRANSLATIONS['alert-reset-error'][currentLanguage]);
            }
        } catch (err) {
            alert(TRANSLATIONS['alert-server-error'][currentLanguage]);
        }
    });

    // Show support info toggle
    document.getElementById('btn-show-support-info')?.addEventListener('click', () => {
        const supportBox = document.getElementById('support-info-box');
        if (supportBox) {
            supportBox.style.display = supportBox.style.display === 'none' ? 'block' : 'none';
        }
    });

    // Admin tab click to refresh stats
    document.getElementById('admin-tab-btn')?.addEventListener('click', () => {
        fetchAdminStats();
    });
}

// --- MODALS (Add transaction and edit Goal weight) ---
function setupModals() {
    const addTxModal = document.getElementById('modal-add-tx');
    const editGoalModal = document.getElementById('modal-edit-goal');

    // Open Add Transaction
    document.getElementById('btn-open-tx-modal')?.addEventListener('click', () => {
        addTxModal?.classList.add('active');
    });
    // Close Add Transaction
    document.getElementById('btn-close-tx-modal')?.addEventListener('click', () => {
        addTxModal?.classList.remove('active');
    });

    // Weights Breakdown Modal
    const breakdownModal = document.getElementById('modal-weights-breakdown');
    document.getElementById('card-total-weight')?.addEventListener('click', () => {
        breakdownModal?.classList.add('active');
    });
    document.getElementById('btn-close-breakdown-modal')?.addEventListener('click', () => {
        breakdownModal?.classList.remove('active');
    });

    // Open Edit Goal
    document.getElementById('btn-edit-goal')?.addEventListener('click', () => {
        if (portfoliosData && portfoliosData.portfolios[activePortfolioId]) {
            const currentGoal = portfoliosData.portfolios[activePortfolioId].goalWeight || 50;
            const inputField = document.getElementById('input-goal-weight');
            if (inputField) inputField.value = currentGoal;
            editGoalModal?.classList.add('active');
        }
    });
    // Close Edit Goal
    document.getElementById('btn-close-goal-modal')?.addEventListener('click', () => {
        editGoalModal?.classList.remove('active');
    });

    // Profile Modal Listeners
    document.getElementById('user-badge')?.addEventListener('click', () => {
        openUserProfileModal();
    });
    document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => {
        document.getElementById('modal-user-profile')?.classList.remove('active');
    });

    // Save Goal settings
    document.getElementById('btn-save-goal-settings')?.addEventListener('click', async () => {
        const inputField = document.getElementById('input-goal-weight');
        const num = parseFloat(inputField.value);
        if (isNaN(num) || num <= 0) {
            alert(TRANSLATIONS['alert-invalid-weight'][currentLanguage]);
            return;
        }

        if (portfoliosData && portfoliosData.portfolios[activePortfolioId]) {
            portfoliosData.portfolios[activePortfolioId].goalWeight = num;
            await saveEncryptedData();
            renderPortfolio();
            editGoalModal?.classList.remove('active');
        }
    });

    // User Guide Modal
    const userGuideModal = document.getElementById('modal-user-guide');
    document.getElementById('btn-open-guide')?.addEventListener('click', () => {
        userGuideModal?.classList.add('active');
    });
    document.getElementById('btn-close-guide')?.addEventListener('click', () => {
        userGuideModal?.classList.remove('active');
    });

    // Close on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === addTxModal) addTxModal?.classList.remove('active');
        if (e.target === editGoalModal) editGoalModal?.classList.remove('active');
        if (e.target === userGuideModal) userGuideModal?.classList.remove('active');
    });
}

// --- FETCH LIVE PRICES OR FALLBACKS ---
async function fetchPrices() {
    const updateTimeEl = document.getElementById('tick-update-time');
    try {
        const response = await fetch('/api/gold-prices');
        if (!response.ok) throw new Error('API server unreachable');
        
        const data = await response.json();
        goldPrices = data;
        
        localStorage.setItem('dahaby_cached_prices', JSON.stringify(data));
        renderAllData();
    } catch (e) {
        console.warn('Network issue, attempting cached offline values:', e.message);
        
        const cached = localStorage.getItem('dahaby_cached_prices');
        if (cached) {
            goldPrices = JSON.parse(cached);
            goldPrices.isOffline = true;
            renderAllData();
            
            if (updateTimeEl) {
                const age = Math.round((Date.now() - new Date(goldPrices.updatedAtTime).getTime()) / 1000 / 60);
                updateTimeEl.textContent = currentLanguage === 'en'
                    ? `Cached copy (${age} min ago)`
                    : `نسخة مخبأة (منذ ${age} دقيقة)`;
                updateTimeEl.classList.add('text-rose');
            }
        } else {
            if (updateTimeEl) updateTimeEl.textContent = currentLanguage === 'en' ? 'Offline' : 'غير متصل بالإنترنت';
        }
    }
}

function translateUpdatedTime(text) {
    if (!text) return currentLanguage === 'en' ? 'Live Now' : 'محدث الآن';
    if (currentLanguage !== 'en') return text;
    let enText = text;
    enText = enText.replace('أسعار استرشادية (مؤقتة)', 'Indicative Prices (Temporary)');
    enText = enText.replace('محدث', 'Updated');
    enText = enText.replace('منذ', 'ago');
    enText = enText.replace('دقيقة', 'minute(s)');
    enText = enText.replace('ساعة', 'hour(s)');
    enText = enText.replace('ثانية', 'second(s)');
    enText = enText.replace('دقائق', 'minutes');
    enText = enText.replace('ساعات', 'hours');
    enText = enText.replace('ثواني', 'seconds');
    enText = enText.replace('قبل', 'before');
    enText = enText.replace('يوم', 'day');
    enText = enText.replace('أيام', 'days');
    const numerals = {'٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9'};
    for (let char in numerals) {
        enText = enText.split(char).join(numerals[char]);
    }
    return enText;
}

function renderAllData() {
    const data = goldPrices;
    if (!data) return;

    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';

    // 1. Live Ticker
    document.getElementById('tick-gold-dollar').textContent = `${formatNumber(data.usdGoldDollar)} ${egpLabel}`;
    document.getElementById('tick-bank-dollar').textContent = `${formatNumber(data.usdBankDollar)} ${egpLabel}`;
    
    if (data.usdGoldDollar && data.usdBankDollar) {
        const gap = ((data.usdGoldDollar - data.usdBankDollar) / data.usdBankDollar) * 100;
        const gapEl = document.getElementById('tick-gap');
        gapEl.textContent = `${gap.toFixed(1)}%`;
        gapEl.className = gap > 2 ? 'item-val font-bold text-rose' : 'item-val font-bold text-emerald';
    }
    
    document.getElementById('tick-ounce').textContent = `$${formatNumber(data.prices.ounce_usd)}`;
    
    if (!data.isOffline) {
        document.getElementById('tick-update-time').textContent = translateUpdatedTime(data.updatedAtText);
        document.getElementById('tick-update-time').classList.remove('text-rose');
    }

    // 2. Pricing Box Cards Grid
    renderPriceCards(data);

    // 3. Nisab
    renderZakatNisab(data);

    // 4. Portfolio values
    renderPortfolio();

    // 5. Run calculators
    calculatePurchase();
    calculateSelling();
    calculateSwap();
    renderBudget();
}

function renderPriceCards(data) {
    const container = document.getElementById('price-cards-container');
    if (!container) return;

    container.innerHTML = '';
    const prices = data.prices;
    
    const p24 = prices['24k'] || { sell: 0, buy: 0 };
    const p22 = {
        sell: Math.round(p24.sell * 22 / 24),
        buy: Math.round(p24.buy * 22 / 24)
    };

    const isEn = currentLanguage === 'en';

    const rows = [
        { key: '24k', name: isEn ? '24K (Bullion)' : 'عيار 24 (سبائك)', sell: prices['24k']?.sell, buy: prices['24k']?.buy },
        { key: '22k', name: isEn ? '22K' : 'عيار 22', sell: p22.sell, buy: p22.buy },
        { key: '21k', name: isEn ? '21K (Market)' : 'عيار 21 (صاغة)', sell: prices['21k']?.sell, buy: prices['21k']?.buy, popular: true },
        { key: '18k', name: isEn ? '18K (Jewelry)' : 'عيار 18 (مشغولات)', sell: prices['18k']?.sell, buy: prices['18k']?.buy },
        { key: '14k', name: isEn ? '14K' : 'عيار 14', sell: prices['14k']?.sell, buy: prices['14k']?.buy },
        { key: 'coin', name: isEn ? 'Gold Coin (8g 21K)' : 'الجنيه الذهب (8ج ع21)', sell: prices['coin']?.sell, buy: prices['coin']?.buy }
    ];

    rows.forEach(row => {
        const box = document.createElement('div');
        box.className = `price-box-card ${row.popular ? 'popular' : ''}`;
        
        const change = (Math.random() * 0.35 - 0.1).toFixed(2);
        const changeClass = change >= 0 ? 'text-emerald' : 'text-rose';
        const changeIcon = change >= 0 ? 'arrow-up-right' : 'arrow-down-right';

        const popularBadge = isEn ? '<span class="popular-badge">Most Popular in Egypt</span>' : '<span class="popular-badge">الأكثر تداولا بمصر</span>';
        const buyLabel = isEn ? 'Buy (Jeweler)' : 'شراء (صائغ)';
        const sellLabel = isEn ? 'Sell (Jeweler)' : 'بيع (صائغ)';

        box.innerHTML = `
            ${row.popular ? popularBadge : ''}
            <h5>${row.name}</h5>
            <div class="price-box-values">
                <div class="price-box-val">
                    <span>${buyLabel}</span>
                    <span class="text-rose">${formatNumber(row.buy)}</span>
                </div>
                <div class="price-box-val">
                    <span>${sellLabel}</span>
                    <span class="text-emerald">${formatNumber(row.sell)}</span>
                </div>
            </div>
            <span class="price-box-change ${changeClass}">
                <i data-lucide="${changeIcon}" style="width: 10px; height: 10px;"></i>
                ${Math.abs(change)}%
            </span>
        `;
        container.appendChild(box);
    });

    if (window.lucide) window.lucide.createIcons();
    initPriceChart();
}

function renderZakatNisab(data) {
    const p24 = data.prices['24k']?.sell || 0;
    const nisab = data.nisabZakat || (p24 * 85);
    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';

    document.getElementById('z-res-nisab-val').textContent = `${formatNumber(Math.round(nisab))} ${egpLabel}`;
}

// --- PORTFOLIOS CONTROL (Tab 2) ---
function renderPortfolioSelector() {
    const select = document.getElementById('portfolio-selector');
    if (!select || !portfoliosData) return;

    select.innerHTML = '';
    Object.keys(portfoliosData.portfolios).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = portfoliosData.portfolios[key].name;
        if (key === activePortfolioId) option.selected = true;
        select.appendChild(option);
    });
}

function setupPortfolioListeners() {
    const selector = document.getElementById('portfolio-selector');
    if (selector) {
        selector.addEventListener('change', () => {
            activePortfolioId = selector.value;
            portfoliosData.activePortfolioId = activePortfolioId;
            saveEncryptedData();
            renderPortfolio();
        });
    }

    // Add portfolio
    document.getElementById('btn-add-portfolio')?.addEventListener('click', async () => {
        const name = prompt(currentLanguage === 'en' ? 'Enter the name of the new portfolio:' : 'أدخل اسم المحفظة الاستثمارية الجديدة:');
        if (!name || name.trim() === '') return;

        const id = 'port_' + Date.now();
        portfoliosData.portfolios[id] = {
            name: name.trim(),
            holdings: [],
            goalWeight: 50,
            monthlySavings: 5000
        };
        activePortfolioId = id;
        portfoliosData.activePortfolioId = id;
        
        await saveEncryptedData();
        renderPortfolioSelector();
        renderPortfolio();
    });

    // Delete portfolio
    document.getElementById('btn-delete-portfolio')?.addEventListener('click', async () => {
        if (!portfoliosData || !portfoliosData.portfolios || !portfoliosData.portfolios[activePortfolioId]) return;
        const keys = Object.keys(portfoliosData.portfolios);
        if (keys.length <= 1) {
            alert(TRANSLATIONS['alert-delete-last-portfolio'][currentLanguage]);
            return;
        }

        const pName = portfoliosData.portfolios[activePortfolioId].name;
        if (!confirm(TRANSLATIONS['confirm-delete-portfolio'][currentLanguage].replace('{name}', pName))) return;

        delete portfoliosData.portfolios[activePortfolioId];
        activePortfolioId = Object.keys(portfoliosData.portfolios)[0];
        portfoliosData.activePortfolioId = activePortfolioId;
        
        await saveEncryptedData();
        renderPortfolioSelector();
        renderPortfolio();
    });

    // Goal simulator savings slider
    const slider = document.getElementById('save-monthly-slider');
    const sliderText = document.getElementById('save-monthly-text');
    if (slider && sliderText) {
        slider.addEventListener('input', async () => {
            const val = parseInt(slider.value);
            sliderText.textContent = currentLanguage === 'en' 
                ? `${formatNumber(val)} EGP / month`
                : `${formatNumber(val)} ج.م / شهر`;
            
            if (portfoliosData && portfoliosData.portfolios[activePortfolioId]) {
                portfoliosData.portfolios[activePortfolioId].monthlySavings = val;
                await saveEncryptedData();
                calculateGoalSimulation();
            }
        });
    }

    // Accordion Toggle for Goals Section
    const btnToggleGoals = document.getElementById('btn-toggle-goals');
    const goalsAccordionContent = document.getElementById('goals-accordion-content');
    const goalsChevron = document.getElementById('goals-chevron');
    
    if (btnToggleGoals && goalsAccordionContent && goalsChevron) {
        btnToggleGoals.addEventListener('click', () => {
            const isClosed = goalsAccordionContent.style.display === 'none' || goalsAccordionContent.style.display === '';
            if (isClosed) {
                goalsAccordionContent.style.display = 'block';
                goalsChevron.classList.add('open');
            } else {
                goalsAccordionContent.style.display = 'none';
                goalsChevron.classList.remove('open');
            }
        });
    }

    // Add transaction Form
    const txForm = document.getElementById('add-transaction-form');
    if (txForm) {
        const typeSelect = document.getElementById('tx-type');
        const brandGroup = document.getElementById('brand-group');
        const karatSelect = document.getElementById('tx-karat');
        const workInput = document.getElementById('tx-workmanship');

        typeSelect.addEventListener('change', () => {
            const type = typeSelect.value;
            const priceLabel = document.querySelector('label[for="tx-price"]');
            const priceInput = document.getElementById('tx-price');
            const weightLabel = document.querySelector('label[for="tx-weight"]');
            const weightInput = document.getElementById('tx-weight');

            const workGroup = document.getElementById('workmanship-group');
            if (type === 'bar' || type === 'coin') {
                brandGroup.style.display = 'none';
                karatSelect.value = type === 'bar' ? '24k' : '21k';
                if (type === 'bar') {
                    if (workGroup) workGroup.style.display = 'none';
                    workInput.value = '0';
                } else {
                    if (workGroup) workGroup.style.display = 'block';
                    workInput.value = '100';
                }
            } else {
                brandGroup.style.display = 'none';
                if (type === 'jewelry') {
                    if (workGroup) workGroup.style.display = 'block';
                    karatSelect.value = '21k';
                    workInput.value = '160';
                } else {
                    if (workGroup) workGroup.style.display = 'none';
                    karatSelect.value = '21k';
                    workInput.value = '0';
                }
            }

            // Dynamic updates for label and placeholder based on coin vs bar/jewelry
            if (type === 'coin') {
                if (priceLabel) priceLabel.textContent = 'إجمالي سعر شراء الجنيهات (بالجنيه)';
                if (priceInput) priceInput.placeholder = 'إجمالي المبلغ شامل المصنعية والضريبة';
                if (weightLabel) weightLabel.textContent = 'عدد الجنيهات الذهب';
                if (weightInput) {
                    weightInput.placeholder = 'مثال: 1';
                    if (weightInput.value === '10') weightInput.value = '1';
                }
            } else {
                if (priceLabel) priceLabel.textContent = 'إجمالي سعر الشراء للمنتج (بالجنيه)';
                if (priceInput) priceInput.placeholder = 'إجمالي المبلغ شامل المصنعية والضريبة';
                if (weightLabel) weightLabel.textContent = 'الوزن (بالجرام)';
                if (weightInput) {
                    weightInput.placeholder = 'مثال: 10';
                    if (weightInput.value === '1') weightInput.value = '10';
                }
            }
        });

        // Initialize defaults
        typeSelect.dispatchEvent(new Event('change'));

        txForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!portfoliosData) return;

            const type = typeSelect.value;
            const karat = karatSelect.value;
            const weight = parseFloat(document.getElementById('tx-weight').value);
            const workmanship = parseFloat(workInput.value) || 0;
            const buyPriceRaw = document.getElementById('tx-price').value;
            const buyPrice = buyPriceRaw ? parseFloat(buyPriceRaw) : 0;
            const brand = 'other';

            if (isNaN(weight) || weight <= 0 || (buyPriceRaw && (isNaN(buyPrice) || buyPrice < 0))) return;

            const quantity = parseInt(document.getElementById('tx-quantity').value) || 1;

            for (let i = 0; i < quantity; i++) {
                const uniqueId = 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const tx = {
                    id: uniqueId,
                    type,
                    karat,
                    weight,
                    workmanship,
                    buyPrice,
                    brand,
                    date: new Date().toISOString()
                };
                portfoliosData.portfolios[activePortfolioId].holdings.push(tx);
            }
            await saveEncryptedData();
            
            // Hide Modal
            document.getElementById('modal-add-tx')?.classList.remove('active');
            
            renderPortfolio();
            txForm.reset();
            typeSelect.dispatchEvent(new Event('change'));
        });
    }
}

function getKaratLabel(karat) {
    const isEn = currentLanguage === 'en';
    const labels = {
        '24k': isEn ? '24K' : 'عيار 24',
        '22k': isEn ? '22K' : 'عيار 22',
        '21k': isEn ? '21K' : 'عيار 21',
        '18k': isEn ? '18K' : 'عيار 18',
        '14k': isEn ? '14K' : 'عيار 14',
        'coin': isEn ? 'Gold Coin' : 'جنيه ذهب'
    };
    return labels[karat] || karat;
}

function renderPortfolio() {
    const list = document.getElementById('portfolio-holdings-list');
    if (!list) return;

    list.innerHTML = '';

    if (!portfoliosData || !portfoliosData.portfolios[activePortfolioId]) {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-muted">${currentLanguage === 'en' ? 'Please unlock your portfolio first.' : 'الرجاء فك قفل محفظتك أولاً.'}</td></tr>`;
        return;
    }

    const p = portfoliosData.portfolios[activePortfolioId];
    
    // Set Slider savings
    const slider = document.getElementById('save-monthly-slider');
    const sliderText = document.getElementById('save-monthly-text');
    if (slider && sliderText && p.monthlySavings) {
        slider.value = p.monthlySavings;
        sliderText.textContent = currentLanguage === 'en' 
            ? `${formatNumber(p.monthlySavings)} EGP / month`
            : `${formatNumber(p.monthlySavings)} ج.م / شهر`;
    }

    if (!goldPrices) {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-muted">${currentLanguage === 'en' ? 'Loading prices...' : 'جاري تحميل الأسعار...'}</td></tr>`;
        return;
    }

    const holdingsList = p.holdings || [];

    if (holdingsList.length === 0) {
        list.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-muted">${currentLanguage === 'en' ? 'Portfolio is empty, record a purchase to track your savings.' : 'المحفظة خالية، سجل عملية شراء لتتبع مدخراتك.'}</td></tr>`;
        updatePortfolioSummary(0, 0, 0, { bar: 0, coin: 0, jewelry: 0, scrap: 0 }, 0, 0, { '24k': 0, '21k': 0, '18k': 0, '14k': 0, 'coin': 0 }, {});
        return;
    }

    let totalWeight21 = 0;
    let totalCurrentValue = 0;
    let totalCost = 0;
    let totalCurrentValueForProfit = 0;
    let totalWeight21ForDCA = 0;
    let typeBreakdown = { bar: 0, coin: 0, jewelry: 0, scrap: 0 };
    let rawWeights = { '24k': 0, '21k': 0, '18k': 0, '14k': 0, 'coin': 0 };
    let barWeightsCount = {};

    holdingsList.forEach(item => {
        const w = parseFloat(item.weight) || 0;
        if (item.type === 'coin') {
            rawWeights['coin'] += w;
        } else {
            const karat = item.karat;
            if (rawWeights[karat] !== undefined) {
                rawWeights[karat] += w;
            }
        }
        if (item.type === 'bar') {
            const barW = parseFloat(item.weight) || 0;
            if (barW > 0) {
                barWeightsCount[barW] = (barWeightsCount[barW] || 0) + 1;
            }
        }
        const karatPriceBuy = getKaratPrice(item.karat, 'buy');
        
        let itemValue = 0;
        if (item.type === 'coin') {
            itemValue = (karatPriceBuy * (item.weight * 8));
            totalWeight21 += item.weight * 8;
            typeBreakdown.coin += item.weight * 8;
        } else {
            itemValue = (karatPriceBuy * item.weight);
            const mult = getKaratMultiplier(item.karat);
            totalWeight21 += item.weight * mult;
            
            if (item.type === 'bar') typeBreakdown.bar += item.weight * mult;
            else if (item.type === 'jewelry') typeBreakdown.jewelry += item.weight * mult;
            else typeBreakdown.scrap += item.weight * mult;
        }

        totalCurrentValue += itemValue;

        const hasKnownCost = item.buyPrice && item.buyPrice > 0;
        let profitText = '';
        let profitClass = '';
        let buyPriceText = '';
        
        const isEn = currentLanguage === 'en';
        const typeLabel = item.type === 'bar' 
            ? (isEn ? '24K Bar' : 'سبيكة 24k') 
            : item.type === 'coin' 
                ? (isEn ? '21K Coin' : 'جنيه 21k') 
                : item.type === 'jewelry' 
                    ? (isEn ? 'Jewelry' : 'مشغولات') 
                    : (isEn ? 'Scrap Gold' : 'كسر');
        const unitLabel = item.type === 'coin' 
            ? (isEn ? 'Coin' : 'الجنيه') 
            : (isEn ? 'Gram' : 'الجرام');
        const egpLabel = isEn ? 'EGP' : 'ج.م';

        if (hasKnownCost) {
            totalCost += item.buyPrice;
            totalCurrentValueForProfit += itemValue;
            totalWeight21ForDCA += item.type === 'coin' ? item.weight * 8 : item.weight * getKaratMultiplier(item.karat);
            
            const profit = itemValue - item.buyPrice;
            const roi = (profit / item.buyPrice) * 100;
            profitClass = profit >= 0 ? 'text-emerald font-bold' : 'text-rose font-bold';
            profitText = `${profit >= 0 ? '+' : ''}${formatNumber(Math.round(profit))} ${egpLabel} (${profit >= 0 ? '+' : ''}${roi.toFixed(1)}%)`;
            
            const calcPricePerUnit = item.buyPrice / item.weight;
            buyPriceText = `
                <span class="font-bold">${formatNumber(Math.round(item.buyPrice))} ${egpLabel}</span>
                <br>
                <span class="text-xs text-muted">(${isEn ? 'Price per' : 'سعر'} ${unitLabel}: ${formatNumber(Math.round(calcPricePerUnit))} ${egpLabel})</span>
            `;
        } else {
            profitClass = 'text-muted';
            profitText = '--';
            buyPriceText = `<span class="text-muted">${isEn ? 'Unknown' : 'غير معروف'}</span>`;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="font-bold">${typeLabel} (${getKaratLabel(item.karat)})</td>
            <td>${item.weight} <span class="text-xs text-muted">${item.type === 'coin' ? (isEn ? 'coin(s)' : 'جنيه') : (isEn ? 'g' : 'جرام')}</span></td>
            <td>${buyPriceText}</td>
            <td class="font-bold">${formatNumber(Math.round(itemValue))} ${egpLabel}</td>
            <td class="${profitClass}">${profitText}</td>
            <td>
                <button class="delete-btn" onclick="deleteTransaction('${item.id}')">
                    <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                </button>
            </td>
        `;
        list.appendChild(tr);
    });

    if (window.lucide) window.lucide.createIcons();
    updatePortfolioSummary(totalWeight21, totalCurrentValue, totalCost, typeBreakdown, totalCurrentValueForProfit, totalWeight21ForDCA, rawWeights, barWeightsCount);
}

function getKaratMultiplier(karat) {
    if (karat === '24k') return 24 / 21;
    if (karat === '22k') return 22 / 21;
    if (karat === '18k') return 18 / 21;
    if (karat === '14k') return 14 / 21;
    return 1;
}

let currentPortfolioRawWeights = { '24k': 0, '21k': 0, '18k': 0, '14k': 0, 'coin': 0 };

function updatePortfolioSummary(totalWeight21, totalCurrentValue, totalCost, typeBreakdown, totalCurrentValueForProfit = 0, totalWeight21ForDCA = 0, rawWeights = null, barWeightsCount = {}) {
    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';
    document.getElementById('port-total-value').textContent = `${formatNumber(Math.round(totalCurrentValue))} ${egpLabel}`;
    
    const usdBank = goldPrices.usdBankDollar || 50;
    const usdEquivalentText = currentLanguage === 'en' ? `Equivalent to $${formatNumber(Math.round(totalCurrentValue / usdBank))}` : `ما يعادل $${formatNumber(Math.round(totalCurrentValue / usdBank))}`;
    document.getElementById('port-total-value-usd').textContent = usdEquivalentText;
    
    const totalWeight24 = totalWeight21 * (21 / 24);
    document.getElementById('port-total-weight').textContent = totalWeight24.toFixed(2);
    
    const breakdown = typeBreakdown || { bar: 0, coin: 0, jewelry: 0, scrap: 0 };
    const breakdownText = currentLanguage === 'en'
        ? `Bars: ${breakdown.bar.toFixed(1)}g | Coins: ${breakdown.coin.toFixed(1)}g | Jewelry: ${breakdown.jewelry.toFixed(1)}g`
        : `سبائك: ${breakdown.bar.toFixed(1)}ج | جنيهات: ${breakdown.coin.toFixed(1)}ج | مشغولات: ${breakdown.jewelry.toFixed(1)}ج`;
    
    document.getElementById('port-weight-breakdown').textContent = currentLanguage === 'en'
        ? 'Click to view detailed weights'
        : 'اضغط لمعرفة الأوزان بالتفصيل';
        
    currentPortfolioRawWeights = rawWeights || { '24k': 0, '21k': 0, '18k': 0, '14k': 0, 'coin': 0 };
    
    const unit = currentLanguage === 'en' ? 'g' : 'جرام';
    const coinUnit = currentLanguage === 'en' ? 'coin(s)' : 'جنيه';
    
    document.getElementById('breakdown-w-24k').textContent = `${currentPortfolioRawWeights['24k'].toFixed(2)} ${unit}`;
    document.getElementById('breakdown-w-21k').textContent = `${currentPortfolioRawWeights['21k'].toFixed(2)} ${unit}`;
    document.getElementById('breakdown-w-18k').textContent = `${currentPortfolioRawWeights['18k'].toFixed(2)} ${unit}`;
    document.getElementById('breakdown-w-14k').textContent = `${currentPortfolioRawWeights['14k'].toFixed(2)} ${unit}`;
    document.getElementById('breakdown-w-coins').textContent = `${currentPortfolioRawWeights['coin']} ${coinUnit}`;
    
    document.getElementById('breakdown-total-24k').textContent = `${totalWeight24.toFixed(2)} ${unit}`;
    document.getElementById('breakdown-total-21k').textContent = `${totalWeight21.toFixed(2)} ${unit}`;

    // Render bullion bars breakdown by weight class
    const barContainer = document.getElementById('breakdown-bars-container');
    const barListEl = document.getElementById('breakdown-bars-list');
    if (barContainer && barListEl) {
        const barWKeys = Object.keys(barWeightsCount).map(Number).sort((a, b) => b - a); // sort desc
        if (barWKeys.length > 0) {
            barListEl.innerHTML = '';
            barWKeys.forEach(wKey => {
                const count = barWeightsCount[wKey];
                const div = document.createElement('div');
                div.style.display = 'flex';
                div.style.justifyContent = 'space-between';
                div.style.fontSize = '12px';
                div.style.padding = '4px 0';
                div.style.borderBottom = '1px dashed rgba(255,255,255,0.06)';
                
                const labelText = currentLanguage === 'en'
                    ? `${count} × ${wKey}g bar${count > 1 ? 's' : ''}`
                    : `عدد ${count} سبيكة فئة ${wKey} جرام`;
                
                const totalText = `${(count * wKey).toFixed(2)} ${unit}`;
                
                div.innerHTML = `
                    <span class="text-muted">${labelText}</span>
                    <span class="font-bold">${totalText}</span>
                `;
                barListEl.appendChild(div);
            });
            barContainer.style.display = 'flex';
        } else {
            barContainer.style.display = 'none';
        }
    }

    // DCA Avg: compute using only items with known costs
    const dcaEl = document.getElementById('port-dca-average');
    if (totalWeight21ForDCA > 0 && totalCost > 0) {
        const dcaAvg = totalCost / totalWeight21ForDCA;
        dcaEl.textContent = `${formatNumber(Math.round(dcaAvg))} ${egpLabel}`;
    } else {
        dcaEl.textContent = `0 ${egpLabel}`;
    }

    // Profit / Loss total: compute using only items with known costs
    const profitEl = document.getElementById('port-total-profit');
    const roiEl = document.getElementById('port-roi');
    if (totalCost > 0) {
        const profit = totalCurrentValueForProfit - totalCost;
        const roi = (profit / totalCost) * 100;
        
        profitEl.textContent = `${profit >= 0 ? '+' : ''}${formatNumber(Math.round(profit))} ${egpLabel}`;
        profitEl.className = profit >= 0 ? 'value text-emerald' : 'value text-rose';
        
        roiEl.textContent = currentLanguage === 'en' ? `ROI: ${profit >= 0 ? '+' : ''}${roi.toFixed(1)}%` : `نسبة العائد: ${profit >= 0 ? '+' : ''}${roi.toFixed(1)}%`;
        roiEl.className = profit >= 0 ? 'sub text-emerald' : 'sub text-rose';
    } else {
        profitEl.textContent = `0 ${egpLabel}`;
        profitEl.className = 'value';
        roiEl.textContent = currentLanguage === 'en' ? 'Record cost to calculate ROI' : 'سجل التكاليف لحساب الأرباح';
        roiEl.className = 'sub';
    }

    // Goals Progress
    const p = portfoliosData.portfolios[activePortfolioId];
    const targetGoal = p.goalWeight || 50;
    const targetGoalEl = document.getElementById('goal-target-text');
    if (targetGoalEl) {
        targetGoalEl.textContent = currentLanguage === 'en' ? `Goal: ${targetGoal} grams (21K equiv)` : `الهدف: ${targetGoal} جرام (معادل عيار 21)`;
    }

    const progressPct = Math.min(100, (totalWeight21 / targetGoal) * 100);
    const progressPctEl = document.getElementById('goal-progress-pct');
    if (progressPctEl) {
        progressPctEl.textContent = `${progressPct.toFixed(1)}%`;
    }

    // SVG Circular Progress Ring dash offset calculation (circumference = 251.33)
    const ringFill = document.getElementById('goal-ring-fill');
    if (ringFill) {
        const offset = 251.33 - (progressPct / 100) * 251.33;
        ringFill.style.strokeDashoffset = offset;
    }

    // Render Allocation Donut Chart
    renderAllocationChart(breakdown);

    calculateGoalSimulation();
}

let allocationChart = null;

function renderAllocationChart(typeBreakdown) {
    const ctx = document.getElementById('allocation-donut-chart');
    if (!ctx) return;

    if (allocationChart) {
        allocationChart.destroy();
    }

    const isEn = currentLanguage === 'en';
    const labels = isEn 
        ? ['24K Bars', '21K Coins', 'Jewelry', 'Scrap Gold'] 
        : ['سبائك ع24', 'جنيهات ع21', 'مشغولات', 'ذهب كسر'];
    const dataValues = [
        typeBreakdown.bar || 0,
        typeBreakdown.coin || 0,
        typeBreakdown.jewelry || 0,
        typeBreakdown.scrap || 0
    ];

    const hasData = dataValues.some(val => val > 0);
    const chartData = hasData ? dataValues : [1, 1, 1, 1];
    
    const isLight = document.body.classList.contains('light-theme');
    
    let chartColors;
    if (hasData) {
        chartColors = ['#A08965', '#21304E', '#CCCAC6', '#2E2E2E'];
    } else {
        chartColors = isLight 
            ? ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)', 'rgba(0,0,0,0.05)']
            : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.05)'];
    }

    allocationChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: chartData,
                backgroundColor: chartColors,
                borderWidth: 1.5,
                borderColor: isLight ? '#ffffff' : '#0a0a0c'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    rtl: !isEn,
                    titleFont: { family: isEn ? 'Inter' : 'Tajawal', size: 10 },
                    bodyFont: { family: isEn ? 'Inter' : 'Tajawal', size: 10 },
                    callbacks: {
                        label: function(context) {
                            if (!hasData) return isEn ? ' No holdings in portfolio' : ' لا يوجد ممتلكات في المحفظة';
                            const unit = isEn ? 'g' : 'جرام';
                            return ` ${context.label}: ${context.raw.toFixed(2)} ${unit}`;
                        }
                    }
                }
            },
            cutout: '75%'
        }
    });
}

function calculateGoalSimulation() {
    if (!goldPrices || !portfoliosData) return;
    
    const p = portfoliosData.portfolios[activePortfolioId];
    const targetGoal = p.goalWeight || 50;
    const monthlySavings = p.monthlySavings || 5000;
    
    let totalWeight21 = 0;
    (p.holdings || []).forEach(item => {
        if (item.type === 'coin') {
            totalWeight21 += item.weight * 8;
        } else {
            totalWeight21 += item.weight * getKaratMultiplier(item.karat);
        }
    });

    const remainingGrams = Math.max(0, targetGoal - totalWeight21);
    const resultTextEl = document.getElementById('goal-simulation-result');

    if (remainingGrams === 0) {
        resultTextEl.innerHTML = currentLanguage === 'en'
            ? `🎉 <b>Congratulations! You have fully achieved your savings goal!</b>`
            : `🎉 <b>تهانينا! لقد حققت هدفك الادخاري بالكامل!</b>`;
        return;
    }

    const p21Sell = getKaratPrice('21k', 'sell');
    const estimatedCost = remainingGrams * p21Sell; // raw price without tax
    const months = Math.ceil(estimatedCost / monthlySavings);

    resultTextEl.innerHTML = currentLanguage === 'en'
        ? `You need <b>${remainingGrams.toFixed(2)} grams</b> more, with an estimated cost of <b>${formatNumber(Math.round(estimatedCost))} EGP</b>. You will reach your goal in approximately <b>${months} months</b>.`
        : `متبقي لك <b>${remainingGrams.toFixed(2)} جرام</b> بقيمة شراء تقريبية <b>${formatNumber(Math.round(estimatedCost))} ج.م</b>. ستصل للهدف خلال <b>${months} شهور</b> تقريبًا.`;
}

window.deleteTransaction = async function(id) {
    if (!portfoliosData || !portfoliosData.portfolios || !portfoliosData.portfolios[activePortfolioId]) return;
    const p = portfoliosData.portfolios[activePortfolioId];
    p.holdings = p.holdings.filter(h => h.id !== id);
    await saveEncryptedData();
    renderPortfolio();
};

function getKaratPrice(karat, type = 'sell') {
    if (!goldPrices) return 0;
    
    if (karat === 'coin') {
        return goldPrices.prices['coin']?.[type] || 0;
    }
    if (karat === '24k') {
        return goldPrices.prices['24k']?.[type] || 0;
    }
    if (karat === '21k') {
        return goldPrices.prices['21k']?.[type] || 0;
    }
    if (karat === '18k') {
        return goldPrices.prices['18k']?.[type] || 0;
    }
    if (karat === '14k') {
        return goldPrices.prices['14k']?.[type] || 0;
    }
    if (karat === '22k') {
        const p24 = goldPrices.prices['24k']?.[type] || 0;
        return Math.round(p24 * 22 / 24);
    }
    return 0;
}

// --- SMART UNIFIED CALCULATOR ---
function setupCalculators() {
    const calcBtns = document.querySelectorAll('.calc-type-btn');
    calcBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const activeView = btn.getAttribute('data-value');
            // Update active class on buttons
            calcBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Hide all sub-views
            document.querySelectorAll('.calc-panel-view').forEach(panel => {
                panel.classList.remove('active');
            });
            // Show current active sub-view
            const targetView = document.getElementById(`calc-view-${activeView}`);
            if (targetView) targetView.classList.add('active');
        });
    });


    // Inputs hookups
    // 1. Purchase
    const pInputs = ['p-karat', 'p-weight', 'p-workmanship', 'p-tax'];
    pInputs.forEach(id => document.getElementById(id)?.addEventListener('input', calculatePurchase));

    // 2. Selling
    const sType = document.getElementById('s-type');
    const sDeductionGroup = document.getElementById('s-deduction-group');
    const sBrandGroup = document.getElementById('s-brand-group');

    sType?.addEventListener('change', () => {
        const sKarat = document.getElementById('s-karat');
        const sWorkRow = document.getElementById('s-res-cashback-row');
        const sDedRow = document.getElementById('s-res-deduction-row');

        sDeductionGroup.style.display = 'flex';
        sBrandGroup.style.display = 'none';
        sKarat.disabled = false;
        sWorkRow.style.display = 'none';
        sDedRow.style.display = 'flex';

        calculateSelling();
    });

    const sInputs = ['s-karat', 's-weight', 's-deduction', 's-deduction-unit', 's-brand'];
    sInputs.forEach(id => document.getElementById(id)?.addEventListener('input', calculateSelling));

    // 3. Swap
    const swapInputs = ['swap-old-karat', 'swap-old-weight', 'swap-old-ded', 'swap-new-karat', 'swap-new-weight', 'swap-new-work', 'swap-new-tax'];
    swapInputs.forEach(id => document.getElementById(id)?.addEventListener('input', calculateSwap));

    // 4. Budget
    const bInputs = ['b-amount', 'b-workmanship'];
    bInputs.forEach(id => document.getElementById(id)?.addEventListener('input', renderBudget));

    // 5. Zakat & Charity
    document.getElementById('btn-sync-z-weights')?.addEventListener('click', syncZakatWeights);
    const zInputs = ['z-w24', 'z-w21', 'z-w18', 'z-w14'];
    zInputs.forEach(id => document.getElementById(id)?.addEventListener('input', calculateZakat));
    document.getElementById('z-charity-slider')?.addEventListener('input', calculateZakat);
    document.getElementById('z-charity-base')?.addEventListener('change', calculateZakat);
    document.getElementsByName('z-purpose').forEach(radio => radio.addEventListener('change', calculateZakat));
}

// Purchase Calculator
function calculatePurchase() {
    if (!goldPrices) return;

    const karat = document.getElementById('p-karat').value;
    const weight = parseFloat(document.getElementById('p-weight').value) || 0;
    const workmanship = parseFloat(document.getElementById('p-workmanship').value) || 0;
    const tax = parseFloat(document.getElementById('p-tax').value) || 0;

    const price = getKaratPrice(karat, 'sell');
    const gramPrice = (price + workmanship) * (1 + tax / 100);
    const invoice = gramPrice * weight;

    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';
    document.getElementById('p-res-pure-gram').textContent = `${formatNumber(price)} ${egpLabel}`;
    document.getElementById('p-res-total-gram').textContent = `${formatNumber(Math.round(gramPrice))} ${egpLabel}`;
    document.getElementById('p-res-total').textContent = `${formatNumber(Math.round(invoice))} ${egpLabel}`;
}

// Selling/Liquidation
function calculateSelling() {
    if (!goldPrices) return;

    const karat = document.getElementById('s-karat').value;
    const weight = parseFloat(document.getElementById('s-weight').value) || 0;
    const deduction = parseFloat(document.getElementById('s-deduction').value) || 0;
    const dedUnit = document.getElementById('s-deduction-unit').value;

    const price = getKaratPrice(karat, 'buy');
    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';
    document.getElementById('s-res-pure-gram').textContent = `${formatNumber(price)} ${egpLabel}`;

    let netWeight = weight;
    if (dedUnit === 'pct') {
        netWeight = weight * (1 - deduction / 100);
    } else {
        netWeight = Math.max(0, weight - deduction);
    }
    const total = netWeight * price;
    const unit = currentLanguage === 'en' ? 'g' : 'جرام';
    document.getElementById('s-res-pure-weight').textContent = `${netWeight.toFixed(2)} ${unit}`;

    document.getElementById('s-res-total').textContent = `${formatNumber(Math.round(total))} ${egpLabel}`;
}

// Swap Calculator
function calculateSwap() {
    if (!goldPrices) return;

    const oldKarat = document.getElementById('swap-old-karat').value;
    const oldWeight = parseFloat(document.getElementById('swap-old-weight').value) || 0;
    const oldDed = parseFloat(document.getElementById('swap-old-ded').value) || 0;

    const newKarat = document.getElementById('swap-new-karat').value;
    const newWeight = parseFloat(document.getElementById('swap-new-weight').value) || 0;
    const newWork = parseFloat(document.getElementById('swap-new-work').value) || 0;
    const newTax = parseFloat(document.getElementById('swap-new-tax').value) || 0;

    const oldBuy = getKaratPrice(oldKarat, 'buy');
    const oldVal = (oldWeight * (1 - oldDed / 100)) * oldBuy;

    const newSell = getKaratPrice(newKarat, 'sell');
    const newVal = (newWeight * newSell + newWork * newWeight) * (1 + newTax / 100);

    const diff = Math.round(newVal - oldVal);

    const egpLabel = currentLanguage === 'en' ? 'EGP' : 'ج.م';
    document.getElementById('swap-res-old-val').textContent = `${formatNumber(Math.round(oldVal))} ${egpLabel}`;
    document.getElementById('swap-res-new-val').textContent = `${formatNumber(Math.round(newVal))} ${egpLabel}`;
    
    const diffEl = document.getElementById('swap-res-diff');
    const note = diff >= 0 
        ? (currentLanguage === 'en' ? 'to Jeweler (you pay)' : 'لصالح الصائغ (تدفعه)')
        : (currentLanguage === 'en' ? 'to You (you receive)' : 'لصالحك (تستلمه)');
    diffEl.textContent = `${formatNumber(Math.abs(diff))} ${egpLabel} ${note}`;
    diffEl.className = diff >= 0 ? 'font-extrabold text-xl text-rose' : 'font-extrabold text-xl text-emerald';
}

// Budget Reverse
function renderBudget() {
    if (!goldPrices) return;

    const budget = parseFloat(document.getElementById('b-amount').value) || 0;
    const workmanship = parseFloat(document.getElementById('b-workmanship').value) || 0;
    const container = document.getElementById('b-results-container');

    if (!container) return;
    container.innerHTML = '';

    const isEn = currentLanguage === 'en';
    const egpLabel = isEn ? 'EGP' : 'ج.م';

    if (budget < 1000) {
        container.innerHTML = `<p class="text-center text-muted py-2">${isEn ? 'Minimum budget is 1,000 EGP' : 'الحد الأدنى هو 1,000 ج.م'}</p>`;
        return;
    }

    const taxFactor = 1.0;

    const karats = [
        { key: '24k', name: isEn ? '24K (Bullion)' : 'عيار 24 (سبائك)' },
        { key: '21k', name: isEn ? '21K (Jewelry)' : 'عيار 21 (مشغولات)' },
        { key: '18k', name: isEn ? '18K (Italian Jewelry)' : 'عيار 18 (مشغولات إيطالي)' },
        { key: '14k', name: isEn ? '14K' : 'عيار 14' }
    ];

    karats.forEach(karat => {
        const price = getKaratPrice(karat.key, 'sell');
        const finalGramPrice = (price + workmanship) * taxFactor;
        const grams = budget / finalGramPrice;

        const row = document.createElement('div');
        row.className = 'budget-option-row';
        row.innerHTML = `
            <div class="option-type font-bold">${karat.name}</div>
            <div class="option-calc">${isEn ? 'You can buy' : 'يمكنك شراء'} <span class="font-extrabold text-lg gold-text">${grams.toFixed(2)}</span> ${isEn ? 'grams' : 'جرام'}</div>
        `;
        container.appendChild(row);
    });

    const rawCoinPrice = getKaratPrice('coin', 'sell');
    const finalCoinCost = (rawCoinPrice + workmanship * 8) * taxFactor;

    if (budget >= finalCoinCost) {
        const count = Math.floor(budget / finalCoinCost);
        const remainder = budget - (count * finalCoinCost);

        const coinRow = document.createElement('div');
        coinRow.className = 'budget-option-row';
        coinRow.style.background = 'rgba(255, 215, 0, 0.04)';
        coinRow.style.borderColor = 'var(--gold-primary)';
        
        const title = isEn ? 'Gold Coin 21K (8g) 👑' : 'جنيه ذهب عيار 21 (8 جرام) 👑';
        const calcText = isEn 
            ? `You can buy <span class="font-extrabold text-lg gold-text">${count}</span> gold coin(s)
               ${remainder > 100 ? `<br><span class="text-xs text-muted">Remaining: ${formatNumber(Math.round(remainder))} EGP</span>` : ''}`
            : `يمكنك شراء <span class="font-extrabold text-lg gold-text">${count}</span> جنيه ذهب
               ${remainder > 100 ? `<br><span class="text-xs text-muted">ويتبقى: ${formatNumber(Math.round(remainder))} ج.م</span>` : ''}`;
        
        coinRow.innerHTML = `
            <div class="option-type font-bold">${title}</div>
            <div class="option-calc">${calcText}</div>
        `;
        container.appendChild(coinRow);
    }
}

// Zakat
function syncZakatWeights() {
    if (!portfoliosData || !portfoliosData.portfolios || !portfoliosData.portfolios[activePortfolioId]) return;
    const p = portfoliosData.portfolios[activePortfolioId];
    let weights = { '24k': 0, '21k': 0, '18k': 0, '14k': 0 };

    p.holdings.forEach(item => {
        if (item.type === 'coin') {
            weights['21k'] += item.weight * 8;
        } else {
            if (weights[item.karat] !== undefined) weights[item.karat] += item.weight;
        }
    });

    document.getElementById('z-w24').value = weights['24k'].toFixed(2);
    document.getElementById('z-w21').value = weights['21k'].toFixed(2);
    document.getElementById('z-w18').value = weights['18k'].toFixed(2);
    document.getElementById('z-w14').value = weights['14k'].toFixed(2);

    calculateZakat();
}

function calculateZakat() {
    if (!goldPrices) return;

    const w24 = parseFloat(document.getElementById('z-w24').value) || 0;
    const w21 = parseFloat(document.getElementById('z-w21').value) || 0;
    const w18 = parseFloat(document.getElementById('z-w18').value) || 0;
    const w14 = parseFloat(document.getElementById('z-w14').value) || 0;
    const purpose = document.querySelector('input[name="z-purpose"]:checked').value;

    const p24 = getKaratPrice('24k', 'buy');
    const p21 = getKaratPrice('21k', 'buy');
    const p18 = getKaratPrice('18k', 'buy');
    const p14 = getKaratPrice('14k', 'buy');

    const eq24 = w24 + (w21 * 21 / 24) + (w18 * 18 / 24) + (w14 * 14 / 24);
    const totalVal = (w24 * p24) + (w21 * p21) + (w18 * p18) + (w14 * p14);
    
    const nisab = goldPrices.nisabZakat || (p24 * 85);
    const hasNisab = eq24 >= 85;

    const isEn = currentLanguage === 'en';
    const egpLabel = isEn ? 'EGP' : 'ج.م';
    const weightUnit = isEn ? 'g' : 'جرام';

    document.getElementById('z-res-equiv-weight').textContent = `${eq24.toFixed(2)} ${weightUnit}`;
    document.getElementById('z-res-total-value').textContent = `${formatNumber(Math.round(totalVal))} ${egpLabel}`;

    const statusBadge = document.getElementById('z-res-status');
    const dueVal = document.getElementById('z-res-due');
    const dueGrams = document.getElementById('z-res-due-grams');
    const noticeBox = document.getElementById('z-res-notice');
    const noticeDesc = document.getElementById('z-res-desc');

    if (hasNisab) {
        statusBadge.textContent = isEn ? 'Nisab Reached ✓' : 'بلغ النصاب الشرعي ✓';
        statusBadge.className = 'badge text-emerald font-bold';
        statusBadge.style.background = 'rgba(0, 230, 118, 0.1)';

        const zakat = totalVal * 0.025;

        if (purpose === 'investment') {
            dueVal.textContent = `${formatNumber(Math.round(zakat))} ${egpLabel}`;
            dueGrams.textContent = isEn 
                ? `Equivalent to ${(zakat / p24).toFixed(2)} g 24K`
                : `ما يعادل ${(zakat / p24).toFixed(2)} جرام عيار 24`;
            noticeDesc.innerHTML = isEn
                ? `Gold has reached Nisab and is held for savings/investment. <b>Zakat is obligatory at 2.5%</b>.`
                : `الذهب قد بلغ النصاب وهو مقتنى للادخار والاستثمار. <b>الزكاة واجبة بمقدار 2.5%</b>.`;
            noticeBox.style.background = 'rgba(0, 230, 118, 0.05)';
            noticeBox.style.borderColor = 'rgba(0, 230, 118, 0.2)';
            noticeBox.querySelector('i').className = 'text-emerald';
        } else {
            dueVal.textContent = isEn ? `Recommended / Precautionary` : `مستحب / احتياطي`;
            dueGrams.textContent = isEn
                ? `For precaution and avoiding differences: ${formatNumber(Math.round(zakat))} EGP`
                : `إذا أردت الاحتياط والخروج من الخلاف: ${formatNumber(Math.round(zakat))} ج.م`;
            noticeDesc.innerHTML = isEn
                ? `Gold has reached Nisab but is for decoration/wear. Most scholars excuse it, while Hanafi scholars recommend it out of precaution.`
                : `الذهب بلغ النصاب ولكنه مخصص للزينة والارتداء. جمهور الفقهاء يرى الإعفاء، ويرى الأحناف الوجوب احتياطاً.`;
            noticeBox.style.background = 'rgba(41, 182, 246, 0.05)';
            noticeBox.style.borderColor = 'rgba(41, 182, 246, 0.2)';
            noticeBox.querySelector('i').className = 'text-info';
        }
    } else {
        statusBadge.textContent = isEn ? 'Did not reach Nisab' : 'لم يبلغ النصاب';
        statusBadge.className = 'badge text-rose';
        statusBadge.style.background = 'rgba(255, 23, 68, 0.1)';
        
        dueVal.textContent = `0 ${egpLabel}`;
        dueGrams.textContent = isEn ? `Shariah Nisab is 85g 24K` : `النصاب الشرعي هو 85 جرام عيار 24`;
        noticeDesc.innerHTML = isEn
            ? `Gold has not reached Shariah Nisab yet. Zakat is not obligatory at this time.`
            : `الذهب لم يبلغ النصاب الشرعي بعد. لا تجب عليك الزكاة حالياً على هذا الوزن.`;
        noticeBox.style.background = 'rgba(41, 182, 246, 0.05)';
        noticeBox.style.borderColor = 'rgba(41, 182, 246, 0.2)';
        noticeBox.querySelector('i').className = 'text-info';
    }

    // --- Voluntary Charity/Sadakah calculations ---
    let netProfit = 0;
    if (portfoliosData && portfoliosData.portfolios[activePortfolioId]) {
        const p = portfoliosData.portfolios[activePortfolioId];
        let totalCurrentValue = 0;
        let totalCost = 0;
        (p.holdings || []).forEach(item => {
            const karatPriceBuy = getKaratPrice(item.karat, 'buy');
            if (item.type === 'coin') {
                totalCurrentValue += (karatPriceBuy * (item.weight * 8));
            } else {
                totalCurrentValue += (karatPriceBuy * item.weight);
            }
            totalCost += item.buyPrice;
        });
        netProfit = Math.max(0, totalCurrentValue - totalCost);
    }

    const charitySlider = document.getElementById('z-charity-slider');
    const charityPct = charitySlider ? parseInt(charitySlider.value) : 0;
    const charityBase = document.getElementById('z-charity-base')?.value || 'total';

    const pctTextEl = document.getElementById('z-charity-pct-text');
    if (pctTextEl) pctTextEl.textContent = `${charityPct}%`;

    let charityBaseVal = 0;
    if (charityBase === 'total') {
        charityBaseVal = totalVal;
    } else {
        charityBaseVal = netProfit;
    }

    const charityDue = charityBaseVal * (charityPct / 100);
    const charityGrams = charityDue / (p21 || 6000);

    const charityDueEl = document.getElementById('z-res-charity-due');
    const charityGramsEl = document.getElementById('z-res-charity-grams');

    if (charityDueEl) charityDueEl.textContent = `${formatNumber(Math.round(charityDue))} ${egpLabel}`;
    if (charityGramsEl) charityGramsEl.textContent = isEn
        ? `Equivalent to ${charityGrams.toFixed(2)} g 21K`
        : `ما يعادل ${charityGrams.toFixed(2)} جم عيار 21`;

    // Motivational quote updater
    const quoteTextEl = document.getElementById('charity-quote-text');
    const quoteCiteEl = document.getElementById('charity-quote-cite');
    if (charityPct === 0) {
        if (quoteTextEl) quoteTextEl.textContent = isEn
            ? `"Charity purifies wealth, brings blessings and growth, and averts misfortune."`
            : `"الصدقة طُهرة للمال، وتجلب البركة والنماء وتدفع البلاء."`;
        if (quoteCiteEl) quoteCiteEl.textContent = isEn ? "Hadith & Ethical Guidance" : "توجيه نبوي وأخلاقي";
    } else {
        const quotesArray = isEn ? CHARITY_QUOTES_EN : CHARITY_QUOTES;
        const quoteIdx = (charityPct - 1) % quotesArray.length;
        const quote = quotesArray[quoteIdx];
        if (quoteTextEl) quoteTextEl.textContent = `"${quote.text}"`;
        if (quoteCiteEl) quoteCiteEl.textContent = quote.cite;
    }

    if (window.lucide) window.lucide.createIcons();
}

// --- CHART CONTROLLER (CHART.JS) ---
let priceChart = null;

function initPriceChart() {
    const ctx = document.getElementById('gold-price-chart');
    if (!ctx) return;

    if (priceChart) {
        priceChart.destroy();
    }

    const data = goldPrices;
    const p21 = data.prices['21k']?.sell || 6000;

    const days = [];
    const values = [];
    const now = new Date();
    
    // Seed factors
    const fluctuations = [-0.011, 0.009, -0.004, 0.014, -0.008, 0.003, 0];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        days.push(d.toLocaleDateString(currentLanguage === 'en' ? 'en-US' : 'ar-EG', { month: 'short', day: 'numeric' }));
        
        let price = p21;
        for (let j = 6; j > 6 - i; j--) {
            price = price / (1 + fluctuations[j]);
        }
        values.push(Math.round(price));
    }

    const isLight = document.body.classList.contains('light-theme');
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.03)' : 'rgba(255, 255, 255, 0.03)';
    const textColor = isLight ? '#495057' : '#a0a0a8';
    const isEn = currentLanguage === 'en';

    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                data: values,
                borderColor: '#A08965',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointBackgroundColor: '#A08965',
                pointBorderColor: isLight ? '#ffffff' : '#000000',
                pointBorderWidth: 1.5,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    rtl: !isEn,
                    titleFont: { family: isEn ? 'Inter' : 'Tajawal' },
                    bodyFont: { family: isEn ? 'Inter' : 'Tajawal' },
                    callbacks: {
                        label: function(context) {
                            return isEn ? ` Price: ${formatNumber(context.raw)} EGP` : ` السعر: ${formatNumber(context.raw)} ج.م`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: isEn ? 'Inter' : 'Tajawal', size: 9 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: isEn ? 'Inter' : 'Tajawal', size: 9 } }
                }
            }
        }
    });
}

// Helper formatting
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return '--';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Admin stats fetching
async function fetchAdminStats() {
    const token = localStorage.getItem('dahaby_jwt');
    if (!token) return;
    try {
        const response = await fetch('/api/admin/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('admin-stat-users').textContent = stats.totalUsers;
            document.getElementById('admin-stat-portfolios').textContent = stats.totalPortfolios;
            document.getElementById('admin-stat-gold').innerHTML = `${stats.totalGoldWeight} <span class="text-xs">جرام</span>`;
        }
    } catch (err) {
        console.error('Error fetching admin stats:', err);
    }
    
    // Also fetch users list
    fetchAdminUsersList();
}

// Admin panel search & reset password listeners
function setupAdminListeners() {
    // Search button click
    const btnSearch = document.getElementById('btn-admin-search');
    const inputSearch = document.getElementById('admin-search-phone');
    
    const triggerSearch = async () => {
        const phone = inputSearch ? inputSearch.value.trim() : '';
        if (!phone) {
            alert(TRANSLATIONS['alert-enter-phone-search'][currentLanguage]);
            return;
        }
        const token = localStorage.getItem('dahaby_jwt');
        try {
            const response = await fetch(`/api/admin/users/search?phone=${phone}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            const resultsBox = document.getElementById('admin-search-results');
            if (response.ok) {
                document.getElementById('admin-res-name').textContent = data.name;
                document.getElementById('admin-res-phone').textContent = data.phone;
                document.getElementById('admin-res-national-id').textContent = data.nationalId;
                
                const regDate = data.createdAt ? new Date(data.createdAt).toLocaleDateString('ar-EG', {
                    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '--';
                document.getElementById('admin-res-date').textContent = regDate;
                document.getElementById('admin-res-gold').textContent = `${data.goldWeight} جرام`;
                document.getElementById('admin-res-eq21').textContent = `${data.eq21Weight} جرام`;
                
                document.getElementById('admin-reset-user-id').value = data.id;
                
                if (resultsBox) resultsBox.style.display = 'block';
                if (window.lucide) window.lucide.createIcons();
            } else {
                alert(data.error || TRANSLATIONS['alert-user-not-found'][currentLanguage]);
                if (resultsBox) resultsBox.style.display = 'none';
            }
        } catch (err) {
            alert(TRANSLATIONS['alert-server-error'][currentLanguage]);
        }
    };
    
    btnSearch?.addEventListener('click', triggerSearch);
    inputSearch?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            triggerSearch();
        }
    });

    // Reset password form submit
    document.getElementById('admin-reset-pw-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const userId = document.getElementById('admin-reset-user-id').value;
        const newPassword = document.getElementById('admin-reset-new-password').value;
        const token = localStorage.getItem('dahaby_jwt');
        
        try {
            const response = await fetch('/api/admin/users/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, newPassword })
            });
            const data = await response.json();
            if (response.ok) {
                alert(TRANSLATIONS['alert-admin-reset-success'][currentLanguage]);
                document.getElementById('admin-reset-pw-form').reset();
            } else {
                alert(data.error || TRANSLATIONS['alert-admin-reset-error'][currentLanguage]);
            }
        } catch (err) {
            alert(TRANSLATIONS['alert-server-error'][currentLanguage]);
        }
    });
}

// Fetch and display registered users in admin panel
async function fetchAdminUsersList() {
    const token = localStorage.getItem('dahaby_jwt');
    if (!token) return;
    const bodyContainer = document.getElementById('admin-users-list-body');
    if (!bodyContainer) return;
    
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const users = await response.json();
            bodyContainer.innerHTML = '';
            if (users.length === 0) {
                bodyContainer.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-muted">لا يوجد مستخدمين مسجلين حالياً.</td></tr>';
                return;
            }
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid var(--border-color)';
                tr.innerHTML = `
                    <td style="padding: 10px 8px; font-weight: 700;">${user.name}</td>
                    <td style="padding: 10px 8px;">${user.phone}</td>
                    <td style="padding: 10px 8px; text-align: left;">
                        <button class="btn-primary" onclick="adminViewUser('${user.phone}')" style="height: 28px; font-size: 11px; padding: 0 10px; width: auto; display: inline-flex; align-items: center; justify-content: center;">عرض التفاصيل</button>
                    </td>
                `;
                bodyContainer.appendChild(tr);
            });
        } else {
            bodyContainer.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-danger">فشل تحميل قائمة المستخدمين.</td></tr>';
        }
    } catch (err) {
        console.error('Error fetching admin users list:', err);
        bodyContainer.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-danger">حدث خطأ أثناء الاتصال بالخادم.</td></tr>';
    }
}

// Global action to view user details from list
window.adminViewUser = function(phone) {
    const searchInput = document.getElementById('admin-search-phone');
    if (searchInput) {
        searchInput.value = phone;
        // Trigger search
        const btnSearch = document.getElementById('btn-admin-search');
        if (btnSearch) btnSearch.click();
        // Scroll smoothly to results
        const resultsBox = document.getElementById('admin-search-results');
        if (resultsBox) {
            resultsBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
};

// Collapsible Live Ticker for Mobile/Tablets
function setupTickerToggle() {
    const toggle = document.getElementById('live-ticker-toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 960) {
                toggle.classList.toggle('expanded');
            }
        });
        
        window.addEventListener('resize', () => {
            if (window.innerWidth > 960) {
                toggle.classList.remove('expanded');
            }
        });
    }
}

// Open User Profile Modal and fetch details
async function openUserProfileModal() {
    const modal = document.getElementById('modal-user-profile');
    if (!modal) return;
    
    const token = localStorage.getItem('dahaby_jwt');
    const isGuest = localStorage.getItem('dahaby_is_guest') === 'true';
    if (!token && !isGuest) return;
    
    // Set weights helper function
    const setWeights = () => {
        let rawWeight = 0;
        let eq21Weight = 0;
        if (portfoliosData && portfoliosData.portfolios && portfoliosData.portfolios[activePortfolioId]) {
            const p = portfoliosData.portfolios[activePortfolioId];
            (p.holdings || []).forEach(item => {
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
        const unit = currentLanguage === 'en' ? 'g' : 'جرام';
        document.getElementById('prof-gold').textContent = `${rawWeight.toFixed(2)} ${unit}`;
        document.getElementById('prof-eq21').textContent = `${eq21Weight.toFixed(2)} ${unit}`;
    };

    if (isGuest) {
        document.getElementById('prof-name').textContent = currentLanguage === 'en' ? 'Guest' : 'زائر';
        document.getElementById('prof-phone').textContent = currentLanguage === 'en' ? 'N/A (Local)' : 'غير متوفر (محلي)';
        document.getElementById('prof-national-id').textContent = currentLanguage === 'en' ? 'N/A' : 'غير متوفر';
        setWeights();
        modal.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
        return;
    }
    
    try {
        const response = await fetch('/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            document.getElementById('prof-name').textContent = user.name;
            document.getElementById('prof-phone').textContent = user.phone;
            document.getElementById('prof-national-id').textContent = user.national_id;
            
            setWeights();
            
            modal.classList.add('active');
            if (window.lucide) window.lucide.createIcons();
        }
    } catch (err) {
        console.error('Error fetching user profile:', err);
    }
}

// --- BILINGUAL MULTI-LANGUAGE SYSTEM ---
function applyLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('qirat_lang', lang);

    const htmlEl = document.documentElement;
    if (lang === 'en') {
        htmlEl.setAttribute('lang', 'en');
        htmlEl.setAttribute('dir', 'ltr');
    } else {
        htmlEl.setAttribute('lang', 'ar');
        htmlEl.setAttribute('dir', 'rtl');
    }

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (TRANSLATIONS[key] && TRANSLATIONS[key][lang] !== undefined) {
            el.innerHTML = TRANSLATIONS[key][lang];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (TRANSLATIONS[key] && TRANSLATIONS[key][lang] !== undefined) {
            el.setAttribute('placeholder', TRANSLATIONS[key][lang]);
        }
    });

    const langBtn = document.getElementById('btn-lang-toggle');
    if (langBtn) {
        langBtn.textContent = lang === 'ar' ? 'EN' : 'AR';
    }

    if (goldPrices) {
        renderAllData();
    }
}

function setupLanguageToggle() {
    const btn = document.getElementById('btn-lang-toggle');
    if (btn) {
        btn.addEventListener('click', () => {
            const nextLang = currentLanguage === 'ar' ? 'en' : 'ar';
            applyLanguage(nextLang);
        });
    }
}
