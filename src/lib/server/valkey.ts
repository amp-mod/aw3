import Valkey from 'iovalkey'
import { env } from '$env/dynamic/private'

export const valkey = new Valkey(env.VALKEY_URL || 'valkey://localhost:6379')
