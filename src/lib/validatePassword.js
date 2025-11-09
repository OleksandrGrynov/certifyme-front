
export function validatePassword(password) {
  const rules = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),

    special: /[!@#$%^&*()_\-+=<>?{}[\]~.,]/.test(password),
  };

  const isValid = Object.values(rules).every(Boolean);
  return { isValid, rules };
}
