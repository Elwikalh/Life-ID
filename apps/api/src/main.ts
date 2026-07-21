import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()
  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000
  await app.listen(port)
  console.log(`Life ID API running on :${port}`)
}
bootstrap()
