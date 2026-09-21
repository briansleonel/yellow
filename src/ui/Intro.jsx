import { INTRO } from '../content.js'

export default function Intro({ onArrancar }) {
  return (
    <div
      className="intro"
      role="button"
      tabIndex={0}
      onClick={onArrancar}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onArrancar()}
    >
      <div className="intro__punto" />
      <h1 className="intro__dedicatoria">{INTRO.dedicatoria}</h1>
      <p className="intro__invitacion">{INTRO.invitacion}</p>
    </div>
  )
}
