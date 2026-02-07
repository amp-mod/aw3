import { FileStorage } from '@flystorage/file-storage'
import { LocalStorageAdapter } from '@flystorage/local-fs'
import { resolve } from 'node:path'

const isDocker = process.env.IS_DOCKER === 'true'

const rootPath = isDocker ? '/uploads' : resolve(process.cwd(), 'dev-fs')

const adapter = new LocalStorageAdapter(rootPath)

export const storage = new FileStorage(adapter)
