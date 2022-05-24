import { IShop } from './database'

export type Link = {
  href: string
  data?: string
}

export type LinkData = {
  url: string
}

export type ScrappedShop = Omit<IShop, 'keywords'> & { link: Link }
