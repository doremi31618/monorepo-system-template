import type { HttpContext } from '@adonisjs/core/http'
import { createUserValidator } from '#validators/user'
import User from '#models/user'

export default class RegistersController {
    public async store({request, response}: HttpContext){
      try{
        const payload = await request.validateUsing(createUserValidator)
        const user = await User.create(payload)
        return response.json(user)
    }
    catch(error){
        return response.status(422).json({
            message: 'Validation failed',
            errors: error.messages,
        })
    }
}}