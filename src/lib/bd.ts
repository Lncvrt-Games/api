export const calculateXP = (
  normalBerries: bigint,
  poisonBerries: bigint,
  slowBerries: bigint,
  ultraBerries: bigint,
  speedyBerries: bigint,
  coinBerries: bigint
): bigint => {
  let totalXp: bigint = 0n

  totalXp += normalBerries
  totalXp -= poisonBerries
  totalXp -= slowBerries
  totalXp += ultraBerries * 5n
  totalXp += speedyBerries * 10n
  totalXp += coinBerries * 10n

  if (totalXp < 0n) totalXp = 0n
  return totalXp
}
