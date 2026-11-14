
/**
 * Independent contact form handler for Lux Motors.
 * No B12, reCAPTCHA, or external form-service dependency.
 */

const CONTACT_FORM_SUBMISSION_URL = '/api/contact'

/**
 * Displays a form submission message.
 */
function setFormSubmissionMessage(
  messageNode: HTMLElement,
  formNode: HTMLFormElement,
  successMessage?: string
) {
  if (successMessage) {
    messageNode.textContent = successMessage
  }

  messageNode.hidden = false
  messageNode.style.display = 'block'

  messageNode.scrollIntoView({
    behavior: 'smooth',
    block: 'center'
  })
}

/**
 * Converts FormData into JSON.
 * Supports multiple values with the same field name.
 */
function formDataToJSON(formData: FormData): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  formData.forEach((value, key) => {
    if (value instanceof File) {
      return
    }

    if (Object.prototype.hasOwnProperty.call(result, key)) {
      const existingValue = result[key]

      if (Array.isArray(existingValue)) {
        existingValue.push(value)
      } else {
        result[key] = [existingValue, value]
      }
    } else {
      result[key] = value
    }
  })

  return result
}

/**
 * Handles one contact form.
 */
function setupForm(formEl: HTMLFormElement) {
  if (formEl.dataset.initialized === 'true') {
    return
  }

  formEl.dataset.initialized = 'true'

  const formId = formEl.dataset.formId || formEl.id || 'contact-form'

  const formBtn = formEl.querySelector(
    'button[type="submit"], input[type="submit"]'
  ) as HTMLButtonElement | HTMLInputElement | null

  const successMessageElement = document.querySelector(
    `#form-done-${CSS.escape(formId)}`
  ) as HTMLElement | null

  const errorMessageElement = document.querySelector(
    `#form-error-${CSS.escape(formId)}`
  ) as HTMLElement | null

  // Configure the form.
  formEl.method = 'POST'
  formEl.action = CONTACT_FORM_SUBMISSION_URL

  formEl.addEventListener('submit', async (event) => {
    event.preventDefault()

    if (formEl.dataset.submitting === 'true') {
      return
    }

    formEl.dataset.submitting = 'true'

    if (formBtn) {
      formBtn.disabled = true
    }

    if (errorMessageElement) {
      errorMessageElement.hidden = true
      errorMessageElement.style.display = 'none'
    }

    try {
      const formData = new FormData(formEl)

      // Honeypot anti-spam protection.
      const honeypot = formData.get('website_url')

      if (honeypot) {
        // Silently reject automated submissions.
        return
      }

      const payload = {
        ...formDataToJSON(formData),
        form_id: formId,
        page_url: window.location.href,
        submitted_at: new Date().toISOString()
      }

      const response = await fetch(CONTACT_FORM_SUBMISSION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const result = await response.json()

      if (result?.redirect) {
        window.location.href = result.redirect
        return
      }

      if (result?.success === false) {
        throw new Error(result.message || 'Form submission failed')
      }

      if (successMessageElement) {
        formEl.style.display = 'none'

        setFormSubmissionMessage(
          successMessageElement,
          formEl,
          result?.success_message || 'پیام شما با موفقیت ارسال شد.'
        )
      } else {
        formEl.reset()

        if (errorMessageElement) {
          errorMessageElement.textContent =
            result?.success_message || 'پیام شما با موفقیت ارسال شد.'

          errorMessageElement.hidden = false
          errorMessageElement.style.display = 'block'
        }
      }
    } catch (error) {
      console.error('Contact form submission error:', error)

      if (errorMessageElement) {
        errorMessageElement.textContent =
          'ارسال پیام با خطا مواجه شد. لطفاً دوباره تلاش کنید.'

        errorMessageElement.hidden = false
        errorMessageElement.style.display = 'block'
      }
    } finally {
      formEl.dataset.submitting = 'false'

      if (formBtn) {
        formBtn.disabled = false
      }
    }
  })
}

/**
 * Initializes all independent contact forms.
 */
function initializeForms() {
  document.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
    // Only initialize forms explicitly marked for contact handling.
    if (!form.dataset.formId && !form.hasAttribute('data-contact-form')) {
      return
    }

    setupForm(form)
  })
}

// Initialize forms safely.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeForms, {
    once: true
  })
} else {
  initializeForms()
}
