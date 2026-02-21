import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { key } = await req.json()
    const adminKey = Deno.env.get('ADMIN_SECRET_KEY')

    if (!key || key !== adminKey) {
      return new Response(JSON.stringify({ error: 'Invalid key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Use a dedicated admin email
    const adminEmail = 'admin@dividend-tracker.internal'
    const adminPassword = 'admin-internal-' + adminKey

    // Try sign in first
    const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    if (!signInError && signInData.session) {
      return new Response(JSON.stringify({
        access_token: signInData.session.access_token,
        refresh_token: signInData.session.refresh_token,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create admin user if doesn't exist
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: { is_admin: true },
    })

    if (createError) {
      console.error('Create admin user error:', createError)
      return new Response(JSON.stringify({ error: 'Failed to create admin session' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Sign in with the newly created user
    const { data: newSignIn, error: newSignInError } = await supabaseAdmin.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword,
    })

    if (newSignInError || !newSignIn.session) {
      return new Response(JSON.stringify({ error: 'Failed to sign in' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update profile with admin name
    await supabaseAdmin
      .from('profiles')
      .update({ display_name: 'Admin' })
      .eq('user_id', createData.user.id)

    return new Response(JSON.stringify({
      access_token: newSignIn.session.access_token,
      refresh_token: newSignIn.session.refresh_token,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Admin login error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
