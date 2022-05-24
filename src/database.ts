import mongoose, { Schema, model } from 'mongoose'

export const connectDatabase = async () => {
  try {
    const { DB_NAME, DB_USER, DB_PWD } = process.env
    await mongoose.connect(`mongodb://${DB_USER}:${DB_PWD}@localhost:27017/${DB_NAME}`)
  } catch {
    console.error('could not connect to mongodb')
    process.exit(2)
  }
}

interface IAddress {
  street: string
  zipCode: string
  city: string
  country: string
}

export interface IShop {
  name: string
  address: IAddress
  phone?: string
  email?: string
  rating?: number
  website?: string
  noCommercialUse?: boolean
}
const ShopSchema = new Schema<IShop>({
  name: String,
  address: {
    type: { street: String, zipCode: String, city: String, country: String },
    required: false,
  },
  phone: { type: String, required: false },
  noCommercialUse: { type: Boolean, required: false },
  email: { type: String, required: false },
  website: { type: String, required: false },
  rating: { type: Number, required: false },
})

const Shop = model('Shop', ShopSchema)

export const upsertShop = async (shop: IShop) => {
  if (shop.phone) {
    const existingShop = await Shop.findOne({ phone: shop.phone })
    if (existingShop) return existingShop
  }
  return Shop.create(shop)
}
