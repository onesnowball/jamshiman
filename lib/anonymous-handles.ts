const COLORS = ['Amber', 'Blue', 'Coral', 'Cyan', 'Emerald', 'Fuchsia', 'Gray', 'Green', 'Indigo', 'Jade', 'Lavender', 'Lime', 'Maroon', 'Mint', 'Navy', 'Olive', 'Orange', 'Pink', 'Purple', 'Red', 'Rose', 'Ruby', 'Silver', 'Slate', 'Teal', 'Violet', 'White', 'Yellow']

const ANIMALS = ['Badger', 'Bear', 'Beaver', 'Bobcat', 'Buffalo', 'Caribou', 'Cheetah', 'Condor', 'Coyote', 'Crane', 'Crow', 'Deer', 'Dolphin', 'Eagle', 'Elk', 'Falcon', 'Ferret', 'Fox', 'Gecko', 'Hawk', 'Heron', 'Jaguar', 'Koala', 'Lemur', 'Leopard', 'Lynx', 'Mink', 'Moose', 'Orca', 'Osprey', 'Otter', 'Owl', 'Panther', 'Penguin', 'Puffin', 'Raven', 'Salamander', 'Seal', 'Sparrow', 'Tiger', 'Viper', 'Walrus', 'Wolf', 'Wolverine', 'Wombat']

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0
  }
  return Math.abs(hash)
}

// Returns a consistent animal handle for a given (authorId, threadId) pair.
// Same author in same thread always gets the same name.
// Different thread = different name.
export function getAnonymousHandle(authorId: string, threadId: string): string {
  const hash = hashCode(authorId + threadId)
  const color = COLORS[hash % COLORS.length]
  const animal = ANIMALS[Math.floor(hash / COLORS.length) % ANIMALS.length]
  return `${color} ${animal}`
}
