import type { HttpContext } from '@adonisjs/core/http'

export default class TestsController {
  public async index({ response }: HttpContext) {
    return response.json({
      message: 'test test',
    })
  }
}
