import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { Link, ScrappedShop } from './types'
import 'dotenv/config'
import { PAGE_JAUNE_URL } from './constants'
import { extractArgs, getUrl, navigate, validateCmd } from './utils'
import { connectDatabase, IShop, upsertShop } from './database'

puppeteer.use(StealthPlugin())

const main = async () => {
  // check command line args
  validateCmd()

  // connect to database
  await connectDatabase()

  // goto pages jaunes
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()
  await page.goto(PAGE_JAUNE_URL)

  // grpc
  try {
    await page.click('span.didomi-continue-without-agreeing')
  } catch {}

  // search
  const [keyword, location] = extractArgs()
  await page.type('#quoiqui', keyword)
  await page.type('#ou', location)
  await navigate(page, 'button[title=Trouver]')

  let hasNextPage = false
  do {
    // extract shop link infos
    const shopLinks = await page.$$eval('ul.bi-list li div.bi-content a.bi-denomination', (tags) =>
      tags.map(
        (tag): Link => ({
          href: tag.getAttribute('href') as string,
          data: tag.getAttribute('data-pjlb') ?? undefined,
        })
      )
    )
    // map shop urls
    const shopUrls = shopLinks
      .filter((shopLink) => !!shopLink.data || shopLink.href !== '#')
      .map((shopLink) => getUrl(shopLink, PAGE_JAUNE_URL))

    for (const shopUrl of shopUrls) {
      await page.goto(shopUrl, { waitUntil: 'load' })
      const { link, ...scrappedShop } = await page.evaluate((): ScrappedShop => {
        // extract name
        const name = document.querySelector('div.denom h1')?.textContent as string
        // extract website
        const linkTag = document.querySelector('div.lvs-container a.pj-link')
        const link = {
          href: linkTag?.getAttribute('href') as string,
          data: linkTag?.getAttribute('data-pjlb') ?? undefined,
        }
        // extract address
        const array = [...document.querySelectorAll('div.address-container a.address > span')].map(
          (tag) => tag.textContent as string
        )
        const [street, zipCode, city] = array
        // extract rating
        const rating = document.querySelector(
          'span.note-container span.fd-note strong'
        )?.textContent
        // extract phone
        const phone = document.querySelector(
          'div.num-container span.nb-phone span.coord-numero'
        )?.textContent
        const hasNoCommercialTag = !!document.querySelector(
          'div.num-container span.nb-phone.with-opposed-market'
        )

        return {
          name,
          rating: rating ? Number.parseInt(rating, 10) : undefined,
          phone: phone?.replace('+33', '0').replaceAll(' ', ''),
          noCommercialUse: !!phone ? hasNoCommercialTag : undefined,
          link,
          address: {
            street,
            zipCode: zipCode.slice(1).trim(),
            city: city.trim(),
            country: 'France',
          },
        }
      })

      // save shop to database
      const shop: IShop = {
        ...scrappedShop,
        website: getUrl(link),
      }
      await upsertShop(shop)

      await page.goBack()
    }
    // navigate to next page if exists
    hasNextPage = !!(await page.$('div.pagination a.link_pagination.next'))
    if (hasNextPage) await navigate(page, 'div.pagination a.link_pagination.next')
  } while (hasNextPage)

  await browser.close()
  process.exit(0)
}

main()
