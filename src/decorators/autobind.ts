namespace App {
  // Autobind
  export function autobind(
    _: any,
    _2: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value
    const adjDescriptor: PropertyDescriptor = {
      configurable: true,
      get() {
        const bound = originalMethod.bind(this)
        return bound
      }
    }

    return adjDescriptor
  }
}