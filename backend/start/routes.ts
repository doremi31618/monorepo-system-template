/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

router.get('/', [() => import('#controllers/tests_controller'), 'index'])
router.post('/auth/register', [() => import('#controllers/auth/registers_controller'), 'store'])
