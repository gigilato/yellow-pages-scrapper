import { Page } from 'puppeteer'
import { Link, LinkData } from './types'

export const validateCmd = () => {
  if (process.argv.length < 4) {
    console.error('Usage : scrapper [keyword] [location]')
    process.exit(1)
  }
}

export const extractArgs = () => process.argv.slice(2)

export const navigate = async (page: Page, selector: string) =>
  Promise.all([page.waitForNavigation(), page.click(selector)])

export const getUrl = (link: Link, prefix = '') => {
  if (link.href !== '#') return `${prefix}${link.href}`
  const { url } = JSON.parse(link.data as string) as LinkData
  const path = Buffer.from(url, 'base64').toString('utf8')
  return `${prefix}${path}`
}
