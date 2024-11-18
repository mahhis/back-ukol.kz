import { Context } from 'koa'
import { Controller, Ctx, Get } from 'amala'
import { badRequest } from '@hapi/boom'
import axios from 'axios'
import env from '@/helpers/env'
//import authorize from '@/midleware/auth'

@Controller('map')
export default class MapController {
  @Get('/autocomplete')
  async autocomplete(@Ctx() ctx: Context) {
    const { input } = ctx.query

    if (!input) {
      ctx.throw(badRequest('Input parameter is required'))
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&types=geocode&key=${env.GOOGLE_MAP_API_KEY}`
      )
      return {
        success: true,
        predictions: response.data.predictions,
      }
    } catch (e) {
      console.log(e)
      ctx.throw(badRequest('Error fetching autocomplete suggestions'))
    }
  }

  @Get('/geocode')
  async geocodeByPlaceID(@Ctx() ctx: Context) {

    const { place_id } = ctx.query

    if (!place_id) {
      ctx.throw(badRequest('place_id parameter is required'))
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?place_id=${place_id}&key=${env.GOOGLE_MAP_API_KEY}`
      )
      console.log(123)
      console.log(response.data.results[0].geometry)

      return {
        success: true,
        geocode: response.data.results[0].geometry.location,
      }
    } catch (e) {
      console.log(e)
      ctx.throw(badRequest('Error fetching autocomplete suggestions'))
    }
  }

  @Get('/latlng')
  async geocode(@Ctx() ctx: Context) {
    const { lat, lng } = ctx.query

    if (!lat || !lng) {
      ctx.throw(badRequest('lat or lng parameter is required'))
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ru&&key=${env.GOOGLE_MAP_API_KEY}`
      )
      console.log(456)
      console.log(response.data.results[0].formatted_address)

      return {
        success: true,
        formatted_address: response.data.results[0].formatted_address,
      }
    } catch (e) {
      console.log(e)
      ctx.throw(badRequest('Error fetching autocomplete suggestions'))
    }
  }
}
