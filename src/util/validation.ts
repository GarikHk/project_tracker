export interface Validatable {
  value: string | number;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

export function validate(validateInput: Validatable) {
  let isValid = true
  const len = validateInput.value.toString().trim().length

  if (validateInput.required) {
    isValid = isValid && len !== 0
  }

  if (validateInput.minLength != null && typeof validateInput.value === "string") {
    isValid = isValid && len >= validateInput.minLength
  }

  if (validateInput.maxLength != null && typeof validateInput.value === "string") {
    isValid = isValid && len <= validateInput.maxLength
  }

  if (validateInput.min != null && typeof validateInput.value === "number") {
    isValid = isValid && validateInput.value >= validateInput.min
  }

  if (validateInput.max != null && typeof validateInput.value === "number") {
    isValid = isValid && validateInput.value <= validateInput.max
  }

  return isValid
}