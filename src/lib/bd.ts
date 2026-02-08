export const calculateXP = (
  normalBerries: number,
  poisonBerries: number,
  slowBerries: number,
  ultraBerries: number,
  speedyBerries: number,
  coinBerries: number
): number => {
  let totalXp: number = 0

  totalXp += normalBerries
  totalXp -= poisonBerries
  totalXp -= slowBerries
  totalXp += ultraBerries * 5
  totalXp += speedyBerries * 10
  totalXp += coinBerries * 10

  if (totalXp < 0n) totalXp = 0
  return totalXp
}
