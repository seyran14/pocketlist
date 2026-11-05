declare module "bmp-js" {
  const bmp: {
    decode(buffer: Buffer): { width: number; height: number; data: Buffer }
  }
  export default bmp
}
