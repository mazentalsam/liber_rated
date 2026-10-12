import { useEffect, useRef, useState } from 'react'
import Search from './Search.jsx'
import Place from './Place.jsx'
import ListBusiness from './ListBusiness.jsx'
import Owner from './Owner.jsx'

// Hash routes: #/, #/place/<id>, #/business, #/owner/<id>/<key>. Working back button and shareable links with no router.
// The owner key lives in the hash, which browsers never send to servers or put in Referer headers.
const parseHash = () => location.hash.slice(2).split('/')

export default function App() {
  const [[page, id, key], setRoute] = useState(parseHash)
  const main = useRef()
  const firstRender = useRef(true)

  useEffect(() => {
    const onHash = () => setRoute(parseHash())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])

  // Move focus to the new page so screen reader users hear the change.
  useEffect(() => {
    if (firstRender.current) firstRender.current = false
    else main.current.focus()
    scrollTo(0, 0)
  }, [page, id])

  const skip = e => { e.preventDefault(); main.current.focus() }
  const current = target => ((page ?? '') === target || (target === 'business' && page === 'owner')) ? 'page' : undefined

  return (
    <>
      <header className="banner">
        <a href="#" className="skip" onClick={skip}>Skip to content</a>
        <div className="banner-inner">
          <a href="#/" className="logo" aria-label="LiberRated, home">Liber<br />Rated</a>
          <nav aria-label="Main">
            <a href="#/" aria-current={current('')}>Find places</a>
            <a href="#/business" aria-current={current('business')}>For businesses</a>
          </nav>
          <p className="tagline">Making accessibility and allergen freedom easy.</p>
        </div>
      </header>
      <main ref={main} tabIndex={-1}>
        {page === 'place' ? <Place id={id} />
          : page === 'business' ? <ListBusiness />
          : page === 'owner' ? <Owner id={id} ownerKey={key} />
          : <Search />}
      </main>
      <footer>Making accessibility and allergen freedom easy. Demo with fictional businesses.</footer>
    </>
  )
}
