import { useMemo } from 'react'

function makeStars(count, seed = 7) {
  let s = seed
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
  return Array.from({ length: count }, (_, i) => {
    const tone = rnd()
    return {
      id: i,
      top: rnd() * 100,
      left: rnd() * 100,
      size: rnd() < 0.82 ? 1.5 : 2.5,
      cls: tone < 0.68 ? '' : tone < 0.85 ? 'cosmos__star--blue' : 'cosmos__star--purple',
      accent: rnd() < 0.08,
      dur: 3 + rnd() * 4,
      delay: -rnd() * 6,
    }
  })
}

export function Cosmos() {
  const stars = useMemo(() => makeStars(90), [])
  return (
    <div className="cosmos" aria-hidden="true">
      <div className="cosmos__blob cosmos__blob--1" />
      <div className="cosmos__blob cosmos__blob--2" />
      <div className="cosmos__blob cosmos__blob--3" />
      {stars.map((st) => (
        <span
          key={st.id}
          className={`cosmos__star ${st.cls} ${st.accent ? 'cosmos__star--accent' : ''}`}
          style={{
            top: `${st.top}%`,
            left: `${st.left}%`,
            width: st.size,
            height: st.size,
            '--tw-dur': `${st.dur}s`,
            '--tw-delay': `${st.delay}s`,
          }}
        />
      ))}
    </div>
  )
}
