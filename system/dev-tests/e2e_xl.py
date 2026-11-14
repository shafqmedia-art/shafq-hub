import asyncio,datetime,openpyxl
from playwright.async_api import async_playwright
U='http://localhost:8765/index.html'; R=[]
def ok(n,c,e=''): R.append(c); print(('PASS ' if c else 'FAIL ')+n,'' if c else e)
async def fm(page,vals):
    for k,v in vals.items():
        el=page.locator(f'#m_{k}')
        if await el.evaluate('e=>e.tagName')=='SELECT': await el.select_option(v)
        else: await el.fill(v)
    await page.locator('#modal button[type=submit]').click(); await page.wait_for_timeout(300)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        ctx=await b.new_context(viewport={'width':1300,'height':900},service_workers='block',accept_downloads=True)
        page=await ctx.new_page(); errs=[]; page.on('pageerror',lambda e:errs.append(str(e)))
        await page.goto(U); await page.wait_for_timeout(500)
        await page.fill('#s_name','عبد الرحمن'); await page.fill('#s_phone','0952000000'); await page.fill('#s_pass','secret12'); await page.click('form[data-form=setup] button'); await page.wait_for_timeout(500)
        await page.goto(U+'#/clients'); await page.wait_for_timeout(200)
        for n in ['الخباز','خواجة غوش']:
            await page.click('[data-act=addClient]'); await fm(page,{'name':n,'value':'500','months':'3'})
        await page.goto(U+'#/team'); await page.wait_for_timeout(200)
        await page.click('[data-act=addMember]'); await fm(page,{'name':'هديل خليفه','phone':'0991197675','pass':'12345678'})
        await page.goto(U+'#/m/content'); await page.wait_for_timeout(300)
        async with page.expect_download() as dl: await page.click('[data-act=xlTemplate]')
        d=await dl.value; await d.save_as('/tmp/tpl.xlsx')
        wb=openpyxl.load_workbook('/tmp/tpl.xlsx'); ws=wb['الخطة']
        ok('template opens, headers',[c.value for c in ws[1]]==['التاريخ','الساعة','العميل','النوع','العنوان','المسؤول','الحالة','ملاحظات'])
        ok('template lists',[c.value for c in wb['القوائم']['A']][:3]==['العملاء','الخباز','خواجة غوش'])
        ok('validations',len(ws.data_validations.dataValidation)==4)
        rows=[(datetime.date(2026,11,15),datetime.time(18,0),'الخباز','ريل','افتتاح الفرع الجديد','هديل خليفة','كتابة','بدون موسيقى'),
              ('16/11/2026','7:30 م','خواجه غوش','بوست','عرض الجمعة','','',''),
              ('2026-11-17','','مطعم مو موجود','ستوري','ستوري المنيو','',None,''),
              (None,None,None,None,None,None,None,None),
              ('٢٠٢٦-١١-١٨','10:00','الخباز','كاروسيل','خمس نصائح','',None,'')]
        for r in rows: ws.append(list(r))
        wb.save('/tmp/plan.xlsx')
        await page.set_input_files('#xlfile','/tmp/plan.xlsx'); await page.wait_for_timeout(800)
        t=await page.locator('#modal').inner_text()
        ok('preview counts','4' in t and 'منشور جاهز' in t,t)
        ok('warning unknown client','مطعم مو موجود' in t,t)
        await page.locator('#modal button[type=submit]').click(); await page.wait_for_timeout(400)
        P=await page.evaluate("SHAFQ.db().items.filter(i=>i.kind=='post').map(i=>[i.date,i.time,i.client_id?SHAFQ.db().clients.find(c=>c.id==i.client_id).name:'',i.type,i.name,i.owner?'o':'',i.status])")
        ok('rows imported',len(P)==4,str(P))
        ok('row1 parsed',P[0]==['2026-11-15','18:00','الخباز','ريل','افتتاح الفرع الجديد','o','كتابة'],str(P[0]))
        ok('row2 dd/mm + pm + fuzzy client',P[1]==['2026-11-16','19:30','خواجة غوش','بوست','عرض الجمعة','','فكرة'],str(P[1]))
        ok('arabic digits date',P[3][0]=='2026-11-18',str(P[3]))
        await page.set_input_files('#xlfile','/tmp/plan.xlsx'); await page.wait_for_timeout(800)
        t=await page.locator('#modal').inner_text(); ok('reupload all duplicates','4' in t and 'موجود من قبل' in t and '0' in t,t)
        await page.click('#modal [data-act=close]')
        ok('still 4',await page.evaluate("SHAFQ.db().items.filter(i=>i.kind=='post').length")==4)
        await page.screenshot(path='/tmp/content_xl.png')
        ok('no js errors',not errs,str(errs))
        await b.close()
asyncio.run(main()); print('%d/%d'%(sum(R),len(R)))
