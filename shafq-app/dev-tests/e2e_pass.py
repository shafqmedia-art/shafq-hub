import asyncio
from playwright.async_api import async_playwright
U='http://localhost:8770/index.html'; R=[]
def ok(n,c,e=''): R.append(c); print(('PASS ' if c else 'FAIL ')+n,'' if c else e)
async def fm(page,vals):
    for k,v in vals.items():
        el=page.locator(f'#m_{k}')
        if await el.evaluate('e=>e.tagName')=='SELECT': await el.select_option(v)
        else: await el.fill(v)
    await page.locator('#modal button[type=submit]').click(); await page.wait_for_timeout(1200)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
        page=await (await b.new_context(service_workers='block')).new_page(); errs=[]; page.on('pageerror',lambda e:errs.append(str(e)))
        await page.goto(U); await page.wait_for_timeout(1200)
        await page.fill('#s_name','عبد الرحمن'); await page.fill('#s_phone','0952000000'); await page.fill('#s_pass','secret12'); await page.click('form[data-form=setup] button'); await page.wait_for_timeout(1800)
        await page.goto(U+'#/team'); await page.wait_for_timeout(400)
        await page.click('[data-act=addMember]'); await fm(page,{'name':'معاذ شموط','phone':'0980033215','pass':'12345678'})
        await page.locator('details.tile').evaluate_all('es=>es.forEach(e=>e.open=true)')
        await page.locator('[data-act=editMember]').first.click(); await page.wait_for_timeout(300)
        ok('password field on edit',await page.locator('#m_pass').count()==1)
        await fm(page,{'pass':'abc'}); ok('short pass rejected','8' in await page.locator('#merr').inner_text())
        await fm(page,{'pass':'newpass1'}); ok('reset saved',await page.locator('#modal').is_hidden(), await page.locator('#merr').inner_text() if await page.locator('#merr').count() else '')
        ok('no js errors',not errs,str(errs)); await b.close()
asyncio.run(main()); print('%d/%d'%(sum(R),len(R)))
