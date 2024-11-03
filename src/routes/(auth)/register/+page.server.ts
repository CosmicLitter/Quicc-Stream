import { fail, redirect } from '@sveltejs/kit'
import { pbError } from '$lib/pocketbase.svelte'
import { dev } from '$app/environment'
import type { PageServerLoad, Actions } from './$types'
import { superValidate } from 'sveltekit-superforms'
import { registerSchema } from '$lib/zodschemas'
import { zod } from "sveltekit-superforms/adapters"

export const load: PageServerLoad = async ({ locals }) => {
  if (locals.user)
    throw redirect(307, '/')

  return {
    form: await superValidate(zod(registerSchema)),
  };
};

export const actions = {
  default: async (event) => {

    const form = await superValidate(event, zod(registerSchema))

    console.log(form)
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }

    dev && console.log('(auth)/register/+page.server', form)

    const user = {
      username: form.data.username,
      password: form.data.password,
      passwordConfirm: form.data.confirmPassword
    }


    dev && console.log('user', user)

    try {
      if (user.username && user.password) {
        await event.locals.pb.collection('users').create(user)
        console.log("user created")
        await event.locals.pb.collection('users').authWithPassword(user.username, user.password)
        console.log("logging in...")
      }

      return { form }

    } catch (err: unknown) {
      if (err instanceof Error) {
        pbError(err)
      }

      return fail(400, { form });
    }


  }
} satisfies Actions
