/* نظام شفق · بيانات النسخة التجريبية (أمثلة وهمية، تتجدد تواريخها كل يوم) */
(function () {
  'use strict';
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function day(n) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + n); return iso(d); }
  function monthDay(k) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(Math.min(k, 28)); return iso(d); }
  function prevMonthDay(k) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() - 1); d.setDate(Math.min(k, 28)); return iso(d); }
  function monthsAgo(n, k) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(1); d.setMonth(d.getMonth() - n); d.setDate(k); return iso(d); }
  var T = new Date().getDate();
  function thisMonthPast(k) { return monthDay(Math.max(1, Math.min(k, T))); }

  function build() {
    var users = [
      { id: 'u1', name: 'رامي', phone: '0930000000', role: 'manager', title: 'المدير', active: true, kind: 'employee', contract: 0 },
      { id: 'u2', name: 'يزن', phone: '0930000002', role: 'member', title: 'مونتير', active: true, kind: 'freelancer', contract: 700 },
      { id: 'u3', name: 'سارة', phone: '0930000003', role: 'member', title: 'مصممة', active: true, kind: 'freelancer', contract: 600 },
      { id: 'u4', name: 'ليلى', phone: '0930000004', role: 'member', title: 'كاتبة محتوى', active: true, kind: 'freelancer', contract: 500 },
      { id: 'u5', name: 'عمر', phone: '0930000005', role: 'member', title: 'مصوّر وطيار درون', active: true, kind: 'employee', contract: 800 },
      { id: 'cu1', name: 'مطعم الياسمين', phone: '0930000010', role: 'client', client_id: 'c1', title: 'عميل', active: true, kind: '', contract: 0 }
    ];
    users.forEach(function (u) { u.email = ''; u.city = 'دمشق'; u.insta = ''; u.bio = ''; u.photo = ''; u.login_phone = u.phone; });
    var clients = [
      { id: 'c1', name: 'مطعم الياسمين', kind: 'page', value: 900, months: 6, start_date: monthsAgo(2, 3), notes: 'منشور الجمعة قبل الظهر.', roles: [{ role: 'مونتير', user: 'u2' }, { role: 'مصممة', user: 'u3' }, { role: 'كاتبة محتوى', user: 'u4' }] },
      { id: 'c2', name: 'عيادة النور للأسنان', kind: 'page', value: 650, months: 3, start_date: monthsAgo(1, 8), notes: '', roles: [{ role: 'مصممة', user: 'u3' }, { role: 'كاتبة محتوى', user: 'u4' }] },
      { id: 'c3', name: 'متجر لمسة', kind: 'page', value: 650, months: 3, start_date: monthsAgo(0, 2), notes: '', roles: [{ role: 'مونتير', user: 'u2' }] },
      { id: 'c4', name: 'مؤتمر دمشق للتقنية', kind: 'project', value: 3500, months: 1, start_date: day(-12), notes: 'تغطية 3 أيام مع محتوى يومي.', roles: [{ role: 'مصوّر', user: 'u5' }, { role: 'مونتير', user: 'u2' }] },
      { id: 'c5', name: 'صيدلية الشفاء', kind: 'page', value: 350, months: 6, start_date: monthsAgo(3, 15), notes: '', roles: [{ role: 'كاتبة محتوى', user: 'u4' }] },
      { id: 'c6', name: 'شركة البناء الحديث', kind: 'project', value: 1200, months: 1, start_date: day(-6), notes: 'تصوير جوي لمشروع سكني.', roles: [{ role: 'طيار درون', user: 'u5' }] }
    ];
    var tasks = [], tn = 0;
    function task(title, user, client, due, done) { tasks.push({ id: 't' + (++tn), title: title, user_id: user, client_id: client || '', client_name: client ? (clients.filter(function (c) { return c.id === client; })[0] || {}).name : '', due: due, done: !!done, done_at: done ? due : '' }); }
    task('مونتاج ريل الطبق الجديد', 'u2', 'c1', day(0)); task('مونتاج فيديو اليوم الثاني من المؤتمر', 'u2', 'c4', day(0)); task('ريل عروض نهاية الأسبوع', 'u2', 'c3', day(1));
    task('فيديو ملخص المؤتمر', 'u2', 'c4', day(3)); task('تعديل الريل حسب ملاحظات العميل', 'u2', 'c1', day(-1)); task('مونتاج قصة العميل', 'u2', 'c1', day(-4), true); task('ريل افتتاح الفرع', 'u2', 'c3', day(-6), true);
    task('تصميم منشور الجمعة', 'u3', 'c1', day(0)); task('كاروسيل نصائح العناية بالأسنان', 'u3', 'c2', day(2)); task('تصميم هوية حملة الشتاء', 'u3', 'c3', day(5)); task('تصميم بوست العروض', 'u3', 'c5', day(-3), true);
    task('كتابة خطة محتوى الشهر القادم', 'u4', 'c1', day(4)); task('نصوص منشورات العيادة', 'u4', 'c2', day(1)); task('ردود التعليقات الأسبوعية', 'u4', 'c5', day(0));
    task('طلعة تصوير جوي للمشروع السكني', 'u5', 'c6', day(2)); task('تصوير اليوم الثالث من المؤتمر', 'u5', 'c4', day(1)); task('تصوير أطباق المطعم', 'u5', 'c1', day(-2), true);
    var moves = [], mn = 0;
    function mv(date, dir, cat, amount, client, user, service, note) { moves.push({ id: 'm' + (++mn), date: date, dir: dir, cat: cat, amount: amount, cur: 'USD', rate: 1, usd: amount, note: note || '', service: service || '', receipt: '', client_id: client || '', user_id: user || '', item_id: '', created_by: 'u1', is_void: false }); }
    // هذا الشهر
    mv(thisMonthPast(2), 'in', 'دفعة عميل', 900, 'c1', '', 'إدارة الصفحة · الشهر الحالي');
    mv(thisMonthPast(3), 'in', 'دفعة عميل', 650, 'c2', '', 'إدارة الصفحة · الشهر الحالي');
    mv(thisMonthPast(4), 'in', 'دفعة عميل', 650, 'c3', '', 'إدارة الصفحة · الشهر الأول');
    mv(day(0), 'in', 'دفعة عميل', 350, 'c5', '', 'إدارة الصفحة · الشهر الحالي');
    mv(thisMonthPast(6), 'in', 'دفعة عميل', 2000, 'c4', '', 'تغطية المؤتمر · الدفعة الأولى');
    mv(thisMonthPast(8), 'in', 'دفعة عميل', 1500, 'c4', '', 'تغطية المؤتمر · الدفعة الثانية');
    mv(thisMonthPast(9), 'in', 'دفعة عميل', 1200, 'c6', '', 'تصوير جوي للمشروع السكني');
    mv(thisMonthPast(10), 'in', 'دخل آخر', 2200, '', '', 'تغطية عرس');
    mv(thisMonthPast(11), 'in', 'دخل آخر', 950, '', '', 'تصوير جوي لمطعم');
    mv(thisMonthPast(5), 'out', 'أجر فريق', 350, '', 'u2', '', 'دفعة من أجر الشهر');
    mv(thisMonthPast(6), 'out', 'أجر فريق', 400, '', 'u3', '', 'دفعة من أجر الشهر');
    mv(thisMonthPast(7), 'out', 'أجر فريق', 300, '', 'u4', '', 'دفعة من أجر الشهر');
    mv(thisMonthPast(8), 'out', 'أجر فريق', 250, '', 'u5', '', 'دفعة من أجر الشهر');
    mv(thisMonthPast(4), 'out', 'تمويل إعلاني', 600, 'c3', '', '', 'إعلان افتتاح المتجر');
    mv(thisMonthPast(6), 'out', 'إيجار معدات', 450, 'c4', '', '', 'إضاءة وميكروفونات للمؤتمر');
    mv(day(0), 'out', 'مواصلات', 180, '', '', '', 'تنقلات الفريق');
    mv(thisMonthPast(10), 'out', 'مصروف آخر', 620, '', '', '', 'اشتراكات برامج ومساحة تخزين');
    // الشهر الماضي
    mv(prevMonthDay(2), 'in', 'دفعة عميل', 900, 'c1', '', 'إدارة الصفحة'); mv(prevMonthDay(5), 'in', 'دفعة عميل', 650, 'c2', '', 'إدارة الصفحة');
    mv(prevMonthDay(7), 'in', 'دفعة عميل', 350, 'c5', '', 'إدارة الصفحة'); mv(prevMonthDay(15), 'in', 'دخل آخر', 3100, '', '', 'تغطية معرض');
    mv(prevMonthDay(20), 'in', 'دخل آخر', 1800, '', '', 'فيلم تعريفي لشركة');
    mv(prevMonthDay(25), 'out', 'أجر فريق', 1900, '', '', '', 'أجور الشهر الماضي'); mv(prevMonthDay(12), 'out', 'تمويل إعلاني', 400, '', '', '', 'حملات العملاء');
    var items = [], inn = 0;
    function post(name, client, type, owner, date, time, status) { items.push({ id: 'p' + (++inn), kind: 'post', status: status, created: day(-10), name: name, client_id: client, type: type, owner: owner, date: date, time: time, notes: '' }); }
    // خطة مطعم الياسمين (يراها العميل)
    post('ريل الطبق الجديد', 'c1', 'ريل', 'u2', day(-9), '19:00', 'منشور');
    post('منشور الجمعة', 'c1', 'منشور الجمعة', 'u3', day(-7), '11:00', 'منشور');
    post('كاروسيل قائمة الإفطار', 'c1', 'كاروسيل', 'u3', day(-5), '09:00', 'منشور');
    post('ريل خلف الكواليس', 'c1', 'ريل', 'u2', day(-3), '20:00', 'منشور');
    post('بوست عرض الغداء', 'c1', 'بوست', 'u3', day(-1), '13:00', 'تصوير ومونتاج');
    post('ريل تحضير الحلويات', 'c1', 'ريل', 'u2', day(0), '19:30', 'مجدول');
    post('ستوري عرض اليوم', 'c1', 'ستوري', 'u3', day(0), '12:00', 'منشور');
    post('منشور الجمعة القادمة', 'c1', 'منشور الجمعة', 'u3', day(2), '11:00', 'موافقة العميل');
    items[items.length - 1].caption = 'جمعة مباركة من مطعم الياسمين.\nطاولتكم محجوزة، والفطور عنا.';
    items[items.length - 1].preview = 'https://shafqmedia.com/';
    items[items.length - 1].sent_at = day(0);
    post('ريل آراء الزبائن', 'c1', 'ريل', 'u2', day(4), '20:00', 'تصوير ومونتاج');
    post('كاروسيل أطباق الشتاء', 'c1', 'كاروسيل', 'u3', day(6), '18:00', 'تحضير');
    post('بوست مسابقة المتابعين', 'c1', 'بوست', 'u4', day(9), '17:00', 'تحضير');
    // عملاء آخرون
    post('نصيحة الأسبوع للعناية بالأسنان', 'c2', 'بوست', 'u3', day(0), '16:00', 'مجدول');
    post('ريل جولة في العيادة', 'c2', 'ريل', 'u2', day(1), '19:00', 'موافقة العميل');
    post('كاروسيل عروض الشتاء', 'c3', 'كاروسيل', 'u3', day(0), '18:30', 'مجدول');
    post('ريل وصول التشكيلة الجديدة', 'c3', 'ريل', 'u2', day(3), '20:00', 'تصوير ومونتاج');
    post('بوست ساعات الدوام', 'c5', 'بوست', 'u4', day(-2), '10:00', 'تحضير');
    post('ملخص اليوم الثاني من المؤتمر', 'c4', 'ريل', 'u2', day(0), '22:00', 'تصوير ومونتاج');
    items.push({ id: 'i1', kind: 'project', status: 'تصوير', created: day(-12), name: 'مؤتمر دمشق للتقنية', type: 'مؤتمر', client_id: 'c4', date: day(-1), place: 'قصر المؤتمرات', team: 'عمر، يزن', price: 3500 });
    items.push({ id: 'i2', kind: 'project', status: 'منتهٍ', created: day(-20), name: 'عرس آل الخطيب', type: 'عرس أو فعالية', client_id: '', party: 'عائلة الخطيب', date: day(-8), place: 'صالة الشام', team: 'عمر', price: 2200 });
    items.push({ id: 'i3', kind: 'project', status: 'مونتاج', created: day(-15), name: 'فيلم تعريفي لشركة البناء الحديث', type: 'فيلم وثائقي', client_id: 'c6', date: day(-4), place: 'موقع المشروع', team: 'عمر، يزن', price: 1200 });
    items.push({ id: 'i4', kind: 'project', status: 'قادم', created: day(-2), name: 'معرض الأثاث الدولي', type: 'معرض', client_id: '', party: 'جناح شركة', date: day(14), place: 'مدينة المعارض', team: '', price: 2800 });
    items.push({ id: 'd1', kind: 'drone', status: 'موعد الطيران', created: day(-3), name: 'شركة البناء الحديث', phone: '0930000020', pack: 'فيديو قصير', area: 'يعفور', date: day(2), time: '07:30', pilot: 'u5', model: 'DJI Mini 4 Pro', permit: 'تم', price: 1200 });
    items.push({ id: 'd2', kind: 'drone', status: 'تسعير وتأكيد', created: day(-1), name: 'مطعم على الطريق', phone: '0930000021', pack: 'صور جوية', area: 'الربوة', date: day(6), time: '16:00', pilot: 'u5', model: 'DJI Mini 4 Pro', permit: '', price: 400 });
    items.push({ id: 'd3', kind: 'drone', status: 'تسليم ودفع', created: day(-9), name: 'مزرعة الريحان', phone: '0930000022', pack: 'فيديو قصير', area: 'الديماس', date: day(-5), time: '17:00', pilot: 'u5', model: 'DJI Mini 4 Pro', permit: 'تم', price: 950 });
    return { users: users, clients: clients, tasks: tasks, moves: moves, debts: [], items: items, rates: (function () { var r = {}; r[today()] = 11500; r[day(-1)] = 11500; return r; })(), settings: { goal: 12000, shafq_phone: '+966563079286' }, _demo: today() };
  }
  window.SHAFQ_DEMO = {
    KEY: 'shafq.demo.db', SKEY: 'shafq.demo.session',
    seed: function () { try { localStorage.setItem(this.KEY, JSON.stringify(build())); } catch (e) {} },
    fresh: function () { try { var d = JSON.parse(localStorage.getItem(this.KEY) || 'null'); return !!d && d._demo === today(); } catch (e) { return false; } },
    reset: function () { try { localStorage.removeItem(this.KEY); localStorage.removeItem(this.SKEY); } catch (e) {} }
  };
})();
