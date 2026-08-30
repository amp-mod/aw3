import Valkey from 'iovalkey'
import { VALKEY_URL } from '$env/static/private'

export const valkey = new Valkey(VALKEY_URL || 'valkey://localhost:6379')
