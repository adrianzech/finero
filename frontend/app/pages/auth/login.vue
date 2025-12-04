<script setup lang="ts">
definePageMeta({
  layout: false,
})

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const loading = ref(false)
const error = ref('')

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const success = await authStore.login(email.value, password.value, rememberMe.value)
    if (success) {
      router.push('/')
    } else {
      error.value = 'Invalid email or password'
    }
  } catch {
    error.value = 'An error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-base-200 relative overflow-hidden">
    <div class="absolute inset-0 overflow-hidden z-0 pointer-events-none">
      <div class="absolute inset-0 bg-gradient-to-br from-base-100/40 via-base-200/40 to-base-300/40" />

      <div class="absolute -top-40 -left-40 w-[32rem] h-[32rem] bg-primary/30 rounded-full blur-[140px]" />
      <div class="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-secondary/30 rounded-full blur-[150px]" />
      <div class="absolute bottom-0 left-1/4 w-[26rem] h-[26rem] bg-accent/25 rounded-full blur-[130px]" />

      <div class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-base-300/40" />
    </div>

    <div class="card w-full max-w-md bg-base-100/80 backdrop-blur-xl shadow-2xl border border-white/20 z-10">
      <div class="card-body p-8">
        <div class="relative mb-6">
          <div class="flex justify-center">
            <Logo />
          </div>

          <div class="absolute right-0 top-1/2 -translate-y-1/2">
            <ThemeToggle class="btn btn-circle btn-outline border-base-300" />
          </div>
        </div>

        <form class="space-y-4" @submit.prevent="handleLogin">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-medium">Email Address</span>
            </label>
            <label
              class="input input-bordered flex items-center gap-2 w-full bg-base-200/50 focus-within:bg-base-100 focus-within:border-primary transition-colors"
            >
              <span class="iconify lucide--user size-4 opacity-70" />
              <input
                v-model="email"
                type="email"
                placeholder="name@example.com"
                class="grow"
                autocomplete="username"
                required
              >
            </label>
          </div>

          <div class="form-control">
            <label class="label justify-between">
              <span class="label-text font-medium">Password</span>
            </label>
            <label
              class="input input-bordered flex items-center gap-2 w-full bg-base-200/50 focus-within:bg-base-100 focus-within:border-primary transition-colors"
            >
              <span class="iconify lucide--lock size-4 opacity-70" />
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="grow"
                autocomplete="current-password"
                required
              >
              <button
                type="button"
                class="btn btn-ghost btn-xs btn-circle text-base-content/60 hover:text-base-content"
                tabindex="-1"
                @click="showPassword = !showPassword"
              >
                <span :class="showPassword ? 'iconify lucide--eye-off size-4' : 'iconify lucide--eye size-4'" />
              </button>
            </label>
          </div>

          <div class="form-control">
            <label class="label cursor-pointer justify-start gap-3">
              <input v-model="rememberMe" type="checkbox" class="checkbox checkbox-primary checkbox-sm">
              <span class="label-text">Remember me</span>
            </label>
          </div>

          <div v-if="error" class="alert alert-error shadow-sm text-sm py-2 mt-2 flex items-center gap-2">
            <span class="iconify lucide--alert-circle size-4" />
            <span>{{ error }}</span>
          </div>

          <div class="form-control mt-4">
            <button type="submit" class="btn btn-primary btn-block shadow-lg shadow-primary/30" :disabled="loading">
              <span v-if="loading" class="loading loading-spinner loading-sm" />
              <span v-else>Sign In</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
