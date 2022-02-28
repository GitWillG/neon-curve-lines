export const checkArrayEqualElements = (_array) => {
  if (typeof _array !== 'undefined') {
    return !!_array.reduce(function (a, b) {
      return a === b ? a : NaN
    })
  }
  return 'Array is Undefined'
}
