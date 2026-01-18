import GameClient from './Client'

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params to support newer Next.js where params can be a Promise
  const { id } = await Promise.resolve(params)
  return <GameClient id={id} />
}
