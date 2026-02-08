import { Context } from 'elysia'
import {
  isAllowedDatabaseVersion,
  isAllowedVersion,
  isBetaVersion,
  isLatestVersion
} from '../lib/util'

export const handler = async ({ request, set }: Context) => {
  set.headers['Content-Type'] = 'text/plain'
  const requester = request.headers.get('Requester') ?? '0'
  const clientVersion = request.headers.get('ClientVersion') ?? '0'

  if (requester === 'BerryDashGodotClient') return 'all;1.0.0'
  else if (isLatestVersion(clientVersion)) return '1'
  else if (isBetaVersion(clientVersion)) return '4'
  else if (
    isAllowedVersion(clientVersion) &&
    isAllowedDatabaseVersion(clientVersion)
  )
    return '2'
  else if (isAllowedVersion(clientVersion)) return '3'
  return '-1'
}
