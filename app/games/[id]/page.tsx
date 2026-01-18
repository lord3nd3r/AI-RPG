import GameClient from './Client'

export default function GamePage({ params }: { params: { id: string } }) {
  const { id } = params
  return <GameClient id={id} />
}
