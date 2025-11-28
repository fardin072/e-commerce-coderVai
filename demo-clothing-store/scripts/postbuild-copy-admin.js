const fs = require("fs")
const path = require("path")

async function copyAdminBundle() {
  const rootDir = process.cwd()
  const source = path.join(rootDir, ".medusa", "server", "public", "admin")
  const destination = path.join(rootDir, "public", "admin")

  if (!fs.existsSync(source)) {
    console.warn(
      '[postbuild] Skipping admin copy because ".medusa/client" was not found.'
    )
    return
  }

  await fs.promises.rm(destination, { recursive: true, force: true })
  await fs.promises.mkdir(path.dirname(destination), { recursive: true })
  await fs.promises.cp(source, destination, { recursive: true })

  console.log('[postbuild] Copied admin bundle to "public/admin".')
}

copyAdminBundle().catch((err) => {
  console.error("[postbuild] Failed to copy admin bundle:", err)
  process.exit(1)
})

