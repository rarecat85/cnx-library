import { defineNuxtPlugin } from '#app'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    components,
    directives,
    theme: {
      defaultTheme: 'light',
      themes: {
        light: {
          colors: {
            // Primary Colors (70-80%)
            primary: '#002C5B', // Unifying Blue
            secondary: '#437F81', // Jade Green
            // Secondary Color (10-20%)
            accent: '#4DDCCC', // Seafoam Teal
            // Accent Colors (<5%)
            error: '#CC3256', // Raspberry Pink
            warning: '#FF7800', // Tangerine Orange
            info: '#FFC818', // Sunshine Yellow
            success: '#437F81', // Jade Green (성공 메시지용)
            // Neutral Grays
            surface: '#FFFFFF', // Bright White
            background: '#F2F2F2', // Cool Gray
            'on-surface': '#2A2F36', // Charcoal Gray (텍스트)
            'on-primary': '#FFFFFF',
            'on-secondary': '#FFFFFF',
            'on-accent': '#2A2F36'
          }
        }
      }
    },
    defaults: {
      global: {
        ripple: true
      },
      VBtn: {
        style: 'text-transform: none;',
        rounded: 'lg',
        elevation: 0
      },
      VCard: {
        elevation: 2,
        rounded: 'lg'
      },
      VTextField: {
        variant: 'outlined',
        density: 'comfortable',
        rounded: 'lg'
      }
    },
    display: {
      mobileBreakpoint: 'sm',
      thresholds: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920
      }
    }
  })

  nuxtApp.vueApp.use(vuetify)
})

