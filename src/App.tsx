import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, CarFront, Check, ChevronDown, ChevronRight, CircleDollarSign, Clipboard, Fuel, Gauge, Menu, PiggyBank, RotateCcw, ShieldCheck, Sparkles, TrendingDown, Wallet, Wrench, X } from 'lucide-react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { calculateCar, compareCar, defaultCar, defaultCompareA, defaultCompareB, formatMoney, type CarCosts, type CompareCar } from './calculator'

const faqItems = [
  ['Что входит в стоимость владения?', 'Топливо, кредитные платежи, страховка, обслуживание, шины, транспортный налог, парковка и прочие расходы. Амортизация показывается отдельно как экономическая стоимость.'],
  ['Как рассчитывается стоимость километра?', 'Сумма расходов за период делится на ожидаемый пробег за этот же период. Если указать нулевой пробег, калькулятор покажет подсказку вместо деления на ноль.'],
  ['Можно ли учесть автокредит?', 'Да. Укажите полный ежемесячный платёж по кредиту. Он учитывается как денежный расход и не дублируется отдельным погашением основного долга.'],
  ['Как учитывается потеря стоимости?', 'Включите амортизацию и задайте ожидаемую стоимость автомобиля в конце периода. Разница с ценой покупки добавится к экономической оценке, отдельно от денежных расходов.'],
  ['Откуда берутся цены на топливо?', 'Цену за литр вводите вы сами. AutoCost не подставляет текущие рыночные цены и не подключается к внешним источникам.'],
  ['Где хранятся мои данные?', 'Параметры сохраняются только в локальном хранилище этого браузера. Они не отправляются на сервер.'],
] as const

function useReveal() {
  useEffect(() => {
    const items = document.querySelectorAll<HTMLElement>('.reveal')
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target) }
    }), { threshold: 0.12 })
    items.forEach(item => observer.observe(item))
    return () => observer.disconnect()
  }, [])
}

function Logo() { return <a className="logo" href="#top" aria-label="AutoCost — на главную"><span className="logo-mark"><CarFront size={19} strokeWidth={2.1} /></span><span>Auto<span>Cost</span></span></a> }
function periodWord(period: 1 | 3 | 5) { return period === 1 ? 'год' : period === 3 ? 'года' : 'лет' }

function AnimatedMoney({ value, decimals = 0 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(value)
  const previous = useRef(value)
  useEffect(() => {
    const start = previous.current
    const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 360
    const startAt = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const progress = duration === 0 ? 1 : Math.min(1, (now - startAt) / duration)
      const eased = 1 - (1 - progress) ** 3
      setDisplay(start + (value - start) * eased)
      if (progress < 1) frame = requestAnimationFrame(tick)
      else previous.current = value
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{formatMoney(display, decimals)}</>
}

function Field({ label, value, onChange, suffix, min = 0, max, step = 1, type = 'number', hint }: { label: string; value: string | number; onChange: (value: string) => void; suffix?: string; min?: number; max?: number; step?: number; type?: string; hint?: string }) {
  return <label className="field"><span className="field-label">{label}</span><span className="input-wrap"><input type={type} min={type === 'number' ? min : undefined} max={type === 'number' ? max : undefined} step={step} value={value} onChange={event => onChange(event.target.value)} required aria-label={label} />{suffix && <span className="suffix">{suffix}</span>}</span>{hint && <span className="field-hint">{hint}</span>}</label>
}

function App() {
  useReveal()
  const [form, setForm] = useState<CarCosts>(defaultCar)
  const [saved, setSaved] = useState(false)
  const [hasEdited, setHasEdited] = useState(false)
  const [formHydrated, setFormHydrated] = useState(false)
  const [compareHydrated, setCompareHydrated] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [copied, setCopied] = useState(false)
  const [storageIssue, setStorageIssue] = useState(false)
  const [carA, setCarA] = useState<CompareCar>(defaultCompareA)
  const [carB, setCarB] = useState<CompareCar>(defaultCompareB)
  const calcRef = useRef<HTMLElement>(null)
  const result = useMemo(() => calculateCar(form), [form])
  const example = useMemo(() => calculateCar(defaultCar), [])
  const comparisonA = useMemo(() => compareCar(carA), [carA])
  const comparisonB = useMemo(() => compareCar(carB), [carB])

  useEffect(() => {
    try {
      const raw = localStorage.getItem('autocost-car-v1')
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (parsed && typeof parsed === 'object' && 'period' in parsed && 'monthlyKm' in parsed) { setForm({ ...defaultCar, ...(parsed as Partial<CarCosts>) }); setHasEdited(true) }
      }
    } catch { setStorageIssue(true) }
    finally { setFormHydrated(true) }
  }, [])
  useEffect(() => {
    if (!formHydrated) return
    try { localStorage.setItem('autocost-car-v1', JSON.stringify(form)); setSaved(true); const timer = window.setTimeout(() => setSaved(false), 1600); return () => window.clearTimeout(timer) }
    catch { setStorageIssue(true) }
  }, [form, formHydrated])
  useEffect(() => {
    try {
      const raw = localStorage.getItem('autocost-compare-v1')
      if (raw) {
        const parsed = JSON.parse(raw) as { carA?: CompareCar; carB?: CompareCar }
        if (parsed.carA && parsed.carB) { setCarA({ ...defaultCompareA, ...parsed.carA }); setCarB({ ...defaultCompareB, ...parsed.carB }) }
      }
    } catch { setStorageIssue(true) }
    finally { setCompareHydrated(true) }
  }, [])
  useEffect(() => {
    if (!compareHydrated) return
    try { localStorage.setItem('autocost-compare-v1', JSON.stringify({ carA, carB })) }
    catch { setStorageIssue(true) }
  }, [carA, carB, compareHydrated])

  const patch = <K extends keyof CarCosts>(key: K, value: CarCosts[K]) => { setHasEdited(true); setForm(current => ({ ...current, [key]: value })) }
  const setNumber = (key: keyof CarCosts, raw: string) => patch(key, (key === 'period' ? Number(raw) : Number(raw)) as never)
  const setCompare = (setter: (updater: (current: CompareCar) => CompareCar) => void, key: keyof CompareCar, raw: string) => setter(current => ({ ...current, [key]: key === 'name' ? raw : Number(raw) }))
  const scrollToCalc = () => calcRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const copyReport = async () => {
    const top = [...result.categories].sort((a, b) => b.value - a.value)[0]
    const report = `AutoCost — отчёт по ${form.make || 'автомобилю'}\nПериод: ${form.period} ${periodWord(form.period)}\nДенежные расходы: ${formatMoney(result.cashTotal)}\nЭкономическая стоимость владения: ${formatMoney(result.economicTotal)}\nВ среднем за месяц: ${formatMoney(result.monthly)}\nСтоимость километра: ${result.perKm === null ? 'не рассчитывается при нулевом пробеге' : formatMoney(result.perKm, 1)}\nТопливо: ${formatMoney(result.fuel)} · Кредит: ${formatMoney(result.loan)}\n${form.includeDepreciation ? `Амортизация: ${formatMoney(result.depreciation)}\n` : ''}Главная статья расходов: ${top?.name ?? '—'}\n\nРасчётная оценка на основе введённых данных.`
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API недоступен')
      await navigator.clipboard.writeText(report)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      const textarea = document.createElement('textarea')
      textarea.value = report
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.append(textarea)
      textarea.select()
      const didCopy = document.execCommand('copy')
      textarea.remove()
      if (didCopy) { setCopied(true); window.setTimeout(() => setCopied(false), 1800) }
      else window.print()
    }
  }
  const reset = () => { setHasEdited(false); setForm({ ...defaultCar, make: '' }); try { localStorage.removeItem('autocost-car-v1') } catch { setStorageIssue(true) } }
  const expenseLeaders = [...result.categories].filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 4)
  const leader = expenseLeaders[0]
  const comparisonWinner = comparisonA.annual === comparisonB.annual ? 'Оба автомобиля обходятся одинаково' : `${comparisonA.annual < comparisonB.annual ? (carA.name || 'Автомобиль A') : (carB.name || 'Автомобиль B')} дешевле в эксплуатации`

  const topStats = [
    { icon: Wallet, label: 'Расходы в месяц', value: result.monthly, example: example.monthly, detail: 'с учётом выбранных параметров', color: 'blue' },
    { icon: TrendingDown, label: 'Расходы в год', value: result.annual, example: example.annual, detail: 'средняя оценка владения', color: 'violet' },
    { icon: Gauge, label: 'Стоимость километра', value: result.perKm ?? 0, example: example.perKm ?? 0, detail: result.perKm === null ? 'укажите месячный пробег' : 'тенге на каждый километр', color: 'mint' },
    { icon: PiggyBank, label: `Прогноз на ${form.period} ${periodWord(form.period)}`, value: result.economicTotal, example: example.economicTotal, detail: 'за выбранный период', color: 'amber' },
  ]
  const timeline = result.categories.filter(item => item.value > 0)
  const chartData = timeline.length ? timeline : [{ name: 'Нет расходов', value: 1, color: '#283040' }]

  return <div id="top" className="site-shell">
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <header className="topbar wrap">
      <Logo />
      <button className="menu-toggle" aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'} aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={20} /> : <Menu size={20} />}</button>
      <nav className={`nav-links ${menuOpen ? 'nav-open' : ''}`} aria-label="Главная навигация" onClick={() => setMenuOpen(false)}>
        <a href="#calculator">Калькулятор</a><a href="#compare">Сравнение</a><a href="#how">Как это работает</a><a href="#faq">Вопросы</a>
      </nav>
      <button className="button button-small button-outline nav-cta" onClick={scrollToCalc}>Мой расчёт <ArrowUpRight size={16} /></button>
    </header>

    <main>
      <section className="hero wrap">
        <div className="hero-copy reveal">
          <div className="eyebrow"><span className="eyebrow-dot" /> Умный контроль расходов на авто</div>
          <h1>Твой автомобиль<br />стоит <span>дороже,</span><br />чем ты думаешь</h1>
          <p className="hero-lede">Ты знаешь цену машины. А знаешь, сколько она тебе стоит? Посчитай топливо, обслуживание и каждый километр — в одной ясной картине.</p>
          <div className="hero-actions"><button className="button button-primary" onClick={scrollToCalc}>Рассчитать стоимость <ArrowRight size={17} /></button><a className="button button-quiet" href="#how">Как это работает <ArrowDown size={16} /></a></div>
          <div className="hero-footnote"><div className="avatar-stack"><i>✓</i><i>₸</i><i>·</i></div><span>Расчёт на основе твоих данных</span><span className="footnote-divider" /> <span>Без регистрации</span></div>
        </div>
        <div className="hero-visual reveal">
          <div className="visual-glow" />
          <img className="hero-car" src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1500&q=88" alt="Современный автомобиль в сумерках" onError={event => { event.currentTarget.style.display = 'none' }} />
          <div className="image-scrim" />
          <div className="hero-visual-label"><span className="live-dot" /> Финансовый профиль автомобиля <span>01 / 04</span></div>
          <div className="floating-card float-mileage"><div className="float-icon"><Fuel size={16} /></div><div><small>Топливо в месяц</small><strong>{formatMoney(example.fuel / 36)}</strong></div><span className="mini-trend">↗</span></div>
          <div className="hero-glass-card">
            <div className="glass-top"><span>ПРИМЕР РАСЧЁТА</span><span className="glass-more">•••</span></div>
            <div className="glass-title">Твоя машина — твои цифры</div>
            <div className="glass-value">{formatMoney(example.monthly)}<small>/ мес</small></div>
            <div className="glass-chart"><svg viewBox="0 0 320 58" role="img" aria-label="Динамика расходов"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#59d2ff" stopOpacity=".28"/><stop offset="1" stopColor="#59d2ff" stopOpacity="0"/></linearGradient></defs><path d="M0 44 C30 38 40 50 70 32 S115 42 143 26 183 34 210 19 250 29 280 9 303 18 320 5 V58 H0Z" fill="url(#area)"/><path d="M0 44 C30 38 40 50 70 32 S115 42 143 26 183 34 210 19 250 29 280 9 303 18 320 5" fill="none" stroke="#5bd5ff" strokeWidth="2.5" strokeLinecap="round"/></svg><div><span>Ваша оценка</span><b>≈ {formatMoney(example.annual)}</b></div></div>
          </div>
          <div className="floating-card float-saved"><span className="saved-icon"><ShieldCheck size={16} /></span><div><small>Данные остаются</small><strong>у тебя</strong></div><Check size={15} className="float-check" /></div>
        </div>
      </section>

      <section className="stats-section wrap reveal" aria-label="Финансовая статистика">
        <div className="section-kicker"><span>ЧЕТЫРЕ ВЗГЛЯДА НА ТВОЙ АВТОМОБИЛЬ</span><span className="example-pill"><i /> {hasEdited ? 'Твой расчёт' : 'Пример расчёта'}</span></div>
        <div className="stats-grid">{topStats.map(({ icon: Icon, label, value, example: exampleValue, detail, color }) => <article className={`stat-card glass-card stat-${color}`} key={label}><div className="stat-head"><span>{label}</span><Icon size={18} /></div><strong className="stat-value"><AnimatedMoney value={hasEdited ? value : exampleValue} decimals={label.includes('километра') ? 1 : 0} /></strong><small>{hasEdited ? detail : 'пример расчёта · ' + detail}</small><span className="stat-spark" /></article>)}</div>
      </section>

      <section className="calculator-section wrap section-space" id="calculator" ref={calcRef}>
        <div className="section-heading reveal"><div><div className="eyebrow"><span className="eyebrow-dot" /> Твоя финансовая картина</div><h2>Посчитай реальную стоимость<br className="desktop-only" /> своего автомобиля</h2><p>Заполни несколько полей — расчёт обновится сразу.</p></div><div className="save-state"><span className={`save-dot ${saved ? 'saved' : ''}`} />{storageIssue ? 'Локальное сохранение недоступно' : saved ? 'Сохранено в браузере' : 'Автосохранение включено'}</div></div>
        {storageIssue && <div className="notice-bar"><ShieldCheck size={16} /> Браузер не разрешил доступ к локальному хранилищу. Расчёт работает, пока открыта страница.</div>}
        <div className="calculator-grid">
          <form className="form-panel glass-card reveal" onSubmit={event => { event.preventDefault(); scrollToCalc() }}>
            <div className="form-head"><div className="form-icon"><CarFront size={19} /></div><div><h3>Параметры автомобиля</h3><p>Укажи данные для точной оценки</p></div><span className="required-note">Всё можно изменить</span></div>
            <div className="form-section-title"><span>АВТОМОБИЛЬ</span><span className="line" /></div>
            <div className="fields-grid">
              <Field label="Марка и модель" value={form.make} type="text" onChange={value => patch('make', value)} suffix="✎" />
              <Field label="Год выпуска" value={form.year} onChange={value => setNumber('year', value)} suffix="г." min={1950} max={new Date().getFullYear()} />
              <Field label="Стоимость автомобиля" value={form.price} onChange={value => setNumber('price', value)} suffix="₸" step={100000} />
              <Field label="Текущий пробег" value={form.mileage} onChange={value => setNumber('mileage', value)} suffix="км" step={1000} />
              <Field label="Расход топлива" value={form.consumption} onChange={value => setNumber('consumption', value)} suffix="л / 100 км" step={0.1} />
              <Field label="Цена топлива за литр" value={form.fuelPrice} onChange={value => setNumber('fuelPrice', value)} suffix="₸ / л" />
              <Field label="Пробег за месяц" value={form.monthlyKm} onChange={value => setNumber('monthlyKm', value)} suffix="км" step={100} hint="Нужен для прогноза и цены километра" />
            </div>
            <div className="form-section-title expense-title"><span>РАСХОДЫ</span><span className="line" /></div>
            <div className="fields-grid">
              <Field label="Платёж по кредиту" value={form.loan} onChange={value => setNumber('loan', value)} suffix="₸ / мес" step={10000} />
              <Field label="Страховка за год" value={form.insurance} onChange={value => setNumber('insurance', value)} suffix="₸ / год" step={5000} />
              <Field label="ТО и ремонт за год" value={form.service} onChange={value => setNumber('service', value)} suffix="₸ / год" step={10000} />
              <Field label="Шины и сезонная смена" value={form.tires} onChange={value => setNumber('tires', value)} suffix="₸ / год" step={5000} />
              <Field label="Транспортный налог" value={form.tax} onChange={value => setNumber('tax', value)} suffix="₸ / год" step={1000} />
              <Field label="Парковка и мойка" value={form.parking} onChange={value => setNumber('parking', value)} suffix="₸ / мес" step={1000} />
              <Field label="Прочие расходы" value={form.other} onChange={value => setNumber('other', value)} suffix="₸ / мес" step={1000} />
            </div>
            <div className="form-section-title expense-title"><span>ГОРИЗОНТ ПРОГНОЗА</span><span className="line" /></div>
            <div className="period-picker" role="group" aria-label="Период расчёта">{([1, 3, 5] as const).map(period => <button type="button" key={period} onClick={() => patch('period', period)} className={form.period === period ? 'period-active' : ''}>{period} {periodWord(period)}</button>)}</div>
            <div className="depreciation-toggle"><div><span className="toggle-title">Учитывать амортизацию</span><small>Потеря стоимости автомобиля за период</small></div><button type="button" role="switch" aria-checked={form.includeDepreciation} className={`switch ${form.includeDepreciation ? 'switch-on' : ''}`} onClick={() => patch('includeDepreciation', !form.includeDepreciation)}><span /></button></div>
            {form.includeDepreciation && <div className="residual-field"><Field label={`Ожидаемая стоимость через ${form.period} ${periodWord(form.period)}`} value={form.residual} onChange={value => setNumber('residual', value)} suffix="₸" step={100000} hint="Амортизация не входит в денежные расходы." /></div>}
            <div className="form-actions"><button className="button button-primary form-submit" type="submit">Рассчитать расходы <ArrowRight size={17} /></button><button className="button button-outline" type="button" onClick={() => { setHasEdited(true); setForm({ ...defaultCar, make: 'Toyota Camry' }) }}>Заполнить пример</button><button className="icon-action" type="button" onClick={reset} aria-label="Сбросить форму" title="Сбросить"><RotateCcw size={17} /></button></div>
            <div className="privacy-note"><ShieldCheck size={15} /> Данные сохраняются локально и не отправляются на сервер</div>
          </form>

          <aside className="results-panel glass-card reveal" aria-live="polite">
            <div className="results-top"><div><span className="results-eyebrow"><Sparkles size={13} /> РЕЗУЛЬТАТ РАСЧЁТА</span><h3>{form.make || 'Твой автомобиль'}</h3><p>{form.period} {periodWord(form.period)} · {new Intl.NumberFormat('ru-RU').format(result.distance)} км прогноза</p></div><span className="period-badge">{form.period}Y</span></div>
            <div className="result-total"><span>Экономическая стоимость владения</span><strong>{formatMoney(result.economicTotal)}</strong><small>Денежные расходы <b>{formatMoney(result.cashTotal)}</b></small></div>
            <div className="result-mini-grid"><div><span>В среднем за месяц</span><strong>{formatMoney(result.monthly)}</strong></div><div><span>Расходы за год</span><strong>{formatMoney(result.annual)}</strong></div><div><span>Стоимость километра</span><strong>{result.perKm === null ? 'Нет пробега' : formatMoney(result.perKm, 1)}</strong></div></div>
            <div className="chart-heading"><span>СТРУКТУРА РАСХОДОВ</span><span>ЗА {form.period} {periodWord(form.period).toUpperCase()}</span></div>
            <div className="chart-block"><div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="68%" outerRadius="92%" paddingAngle={3} stroke="none">{chartData.map((item, index) => <Cell key={`${item.name}-${index}`} fill={item.color} />)}</Pie><Tooltip formatter={value => formatMoney(Number(value))} contentStyle={{ background: '#111722', border: '1px solid #2a3342', borderRadius: 12, color: '#f5f8fc', fontSize: 12 }} /></PieChart></ResponsiveContainer><div className="donut-center"><small>ВСЕГО</small><b>{formatMoney(result.economicTotal)}</b><span>{form.period} {periodWord(form.period)}</span></div></div>
              <div className="legend-list">{expenseLeaders.length ? expenseLeaders.map(item => <div className="legend-row" key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{formatMoney(item.value)}</b></div>) : <div className="empty-chart">Добавь расходы, чтобы увидеть структуру</div>}<div className="legend-row legend-muted"><i /><span>Остальные статьи</span><button type="button" className="text-button" onClick={copyReport}>Отчёт <ArrowUpRight size={12} /></button></div></div></div>
            <div className="expense-breakdown"><div className="breakdown-row"><span><Fuel size={15} /> Топливо</span><b>{formatMoney(result.fuel)}</b></div><div className="breakdown-row"><span><CircleDollarSign size={15} /> Кредит</span><b>{formatMoney(result.loan)}</b></div><div className="breakdown-row"><span><Wrench size={15} /> Сервис, страховка, шины и налог</span><b>{formatMoney(result.service + result.insurance + result.tires + result.tax)}</b></div><div className="breakdown-row"><span><Wallet size={15} /> Парковка и прочее</span><b>{formatMoney(result.parking + result.other)}</b></div>{form.includeDepreciation && <div className="breakdown-row depreciation-row"><span><TrendingDown size={15} /> Амортизация <small>(экономическая)</small></span><b>{formatMoney(result.depreciation)}</b></div>}</div>
            <div className="insight-box"><span className="insight-icon"><Sparkles size={16} /></span><div><small>ГЛАВНЫЙ ВЫВОД</small><p>{leader ? `${leader.name === 'Кредит' ? 'Самая большая нагрузка — кредитный платёж' : `Основная статья расходов — ${leader.name.toLowerCase()}`}` : 'Добавь данные, чтобы увидеть главную статью расходов'}</p></div></div>
            <div className="result-actions"><button className="button button-outline" onClick={copyReport}>{copied ? <Check size={16} /> : <Clipboard size={16} />}{copied ? 'Скопировано' : 'Скопировать отчёт'}</button><button className="button button-quiet" onClick={() => window.print()}>Сохранить в PDF <ArrowUpRight size={15} /></button></div>
          </aside>
        </div>
      </section>

      <section className="compare-section wrap section-space" id="compare">
        <div className="section-heading reveal"><div><div className="eyebrow"><span className="eyebrow-dot" /> Выбирай с цифрами</div><h2>Какой автомобиль<br className="desktop-only" /> выгоднее содержать?</h2><p>Сравни две модели по твоим расходам, а не по ощущениям.</p></div><div className="compare-tag"><CarFront size={16} /> 2 автомобиля</div></div>
        <div className="compare-grid reveal">
          {[{ car: carA, setter: setCarA, id: 'a', label: 'АВТОМОБИЛЬ A', result: comparisonA, color: 'blue' }, { car: carB, setter: setCarB, id: 'b', label: 'АВТОМОБИЛЬ B', result: comparisonB, color: 'violet' }].map(({ car, setter, id, label, result: compared, color }) => <article className={`compare-card glass-card compare-${color}`} key={id}><div className="compare-card-head"><span>{label}</span><span className="compare-edit">РЕДАКТИРУЕТСЯ</span></div><input className="compare-name" value={car.name} aria-label={`${label}: марка и модель`} onChange={event => setCompare(setter, 'name', event.target.value)} /><div className="compare-inputs"><Field label="Расход топлива" value={car.consumption} onChange={value => setCompare(setter, 'consumption', value)} suffix="л / 100 км" step={0.1} /><Field label="Цена топлива" value={car.fuelPrice} onChange={value => setCompare(setter, 'fuelPrice', value)} suffix="₸ / л" /><Field label="Пробег в месяц" value={car.monthlyKm} onChange={value => setCompare(setter, 'monthlyKm', value)} suffix="км" step={100} /><Field label="Кредит в месяц" value={car.loan} onChange={value => setCompare(setter, 'loan', value)} suffix="₸ / мес" step={10000} /><Field label="Страховка за год" value={car.insurance} onChange={value => setCompare(setter, 'insurance', value)} suffix="₸ / год" step={5000} /><Field label="Обслуживание за год" value={car.service} onChange={value => setCompare(setter, 'service', value)} suffix="₸ / год" step={10000} /><Field label="Шины и смена" value={car.tires} onChange={value => setCompare(setter, 'tires', value)} suffix="₸ / год" step={5000} /><Field label="Транспортный налог" value={car.tax} onChange={value => setCompare(setter, 'tax', value)} suffix="₸ / год" step={1000} /><Field label="Парковка и мойка" value={car.parking} onChange={value => setCompare(setter, 'parking', value)} suffix="₸ / мес" step={1000} /><Field label="Прочие расходы" value={car.other} onChange={value => setCompare(setter, 'other', value)} suffix="₸ / мес" step={1000} /></div><div className="compare-cost"><span>Затраты за год</span><strong>{formatMoney(compared.annual)}</strong><div><span>За 3 года</span><b>{formatMoney(compared.threeYears)}</b></div><div><span>Стоимость километра</span><b>{compared.perKm === null ? 'Нет пробега' : formatMoney(compared.perKm, 1)}</b></div><div><span>Топливо / год</span><b>{formatMoney(compared.fuelAnnual)}</b></div><div><span>ТО и шины / год</span><b>{formatMoney(compared.service)}</b></div><div><span>Кредит / год</span><b>{formatMoney(compared.loanAnnual)}</b></div></div></article>)}
          <div className="compare-verdict"><span className="verdict-icon"><TrendingDown size={19} /></span><div><small>СРАВНЕНИЕ НА ОСНОВЕ ТВОИХ ДАННЫХ</small><strong>{comparisonWinner}</strong><p>Разница за год — {formatMoney(Math.abs(comparisonA.annual - comparisonB.annual))}</p></div><div className="compare-bars"><div><span style={{ width: `${Math.max(8, Math.min(100, comparisonA.annual / Math.max(comparisonA.annual, comparisonB.annual, 1) * 100))}%` }} /></div><div><span style={{ width: `${Math.max(8, Math.min(100, comparisonB.annual / Math.max(comparisonA.annual, comparisonB.annual, 1) * 100))}%` }} /></div></div></div>
        </div>
      </section>

      <section className="benefits-section wrap section-space" id="benefits">
        <div className="section-heading center-heading reveal"><div className="eyebrow"><span className="eyebrow-dot" /> Ясность в каждом километре</div><h2>Деньги любят точный маршрут</h2><p>Вся стоимость автомобиля — в одном простом и честном расчёте.</p></div>
        <div className="benefit-grid">{[
          { icon: CircleDollarSign, title: 'Полная стоимость владения', text: 'Собери все статьи расходов в одну понятную картину, от топлива до сезонной смены шин.', tint: 'blue' },
          { icon: Fuel, title: 'Контроль расходов на топливо', text: 'Узнай, сколько уходит на каждый километр и как расход влияет на твой бюджет.', tint: 'violet' },
          { icon: CarFront, title: 'Сравнение автомобилей', text: 'Сопоставь два варианта на одинаковом пробеге и найди более выгодный.', tint: 'mint' },
          { icon: TrendingDown, title: 'Прогноз на несколько лет', text: 'Посмотри вперёд на 1, 3 или 5 лет и учти ожидаемую потерю стоимости.', tint: 'amber' },
        ].map(({ icon: Icon, title, text, tint }, index) => <article className="benefit-card glass-card reveal" key={title}><div className={`benefit-icon tint-${tint}`}><Icon size={20} /></div><span className="benefit-index">0{index + 1}</span><h3>{title}</h3><p>{text}</p><span className="benefit-line" /></article>)}</div>
      </section>

      <section className="how-section wrap section-space" id="how"><div className="how-panel glass-card reveal"><div className="how-copy"><div className="eyebrow"><span className="eyebrow-dot" /> Просто. Честно. Для тебя.</div><h2>Как это<br /><span>работает</span></h2><p>Без сложных формул и скрытых условий. Только понятные цифры, которые помогают принимать решения.</p><button className="button button-outline" onClick={scrollToCalc}>Попробовать калькулятор <ArrowRight size={16} /></button></div><div className="steps-list">{[
          ['01', 'Введи данные автомобиля', 'Марка, пробег, расход и цена топлива — всё, что знаешь сейчас.'],
          ['02', 'Укажи свои расходы', 'Добавь кредит, страховку, ТО, парковку и другие регулярные затраты.'],
          ['03', 'Получи финансовую картину', 'Сравни периоды, оцени цену километра и сохрани отчёт.'],
        ].map(([number, title, text]) => <div className="step-row" key={number}><span className="step-number">{number}</span><div><h3>{title}</h3><p>{text}</p></div><ChevronRight size={17} /></div>)}</div></div></section>

      <section className="faq-section wrap section-space" id="faq"><div className="section-heading reveal"><div><div className="eyebrow"><span className="eyebrow-dot" /> Ответы без мелкого шрифта</div><h2>Есть вопросы?</h2><p>Коротко о том, как работает AutoCost.</p></div></div><div className="faq-list reveal">{faqItems.map(([question, answer], index) => <div className={`faq-item ${openFaq === index ? 'faq-open' : ''}`} key={question}><button aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span><i>{String(index + 1).padStart(2, '0')}</i>{question}</span><span className="faq-chevron"><ChevronDown size={18} /></span></button><div className="faq-answer"><p>{answer}</p></div></div>)}</div></section>

      <section className="final-cta wrap reveal"><div className="cta-orb" /><div className="cta-content"><span className="cta-label"><Sparkles size={14} /> ТВОЯ ФИНАНСОВАЯ ЯСНОСТЬ НАЧИНАЕТСЯ ЗДЕСЬ</span><h2>Теперь ты знаешь,<br />сколько на самом деле стоит <span>твой автомобиль.</span></h2><p>Начни с простого расчёта. Он останется только у тебя.</p><button className="button button-primary" onClick={scrollToCalc}>Рассчитать расходы <ArrowRight size={17} /></button></div><div className="cta-decoration"><div className="ring ring-one"/><div className="ring ring-two"/><div className="ring-core"><CarFront size={28}/></div><span>₸</span></div></section>
    </main>
    <footer className="footer wrap"><div className="footer-top"><Logo /><p>Реальная стоимость владения<br />в ясных цифрах.</p><nav aria-label="Навигация в подвале"><a href="#calculator">Калькулятор</a><a href="#compare">Сравнение</a><a href="#faq">FAQ</a></nav><button className="back-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Наверх <ArrowUpRight size={15}/></button></div><div className="footer-bottom"><span>© AutoCost · {new Date().getFullYear()}</span><span>Результаты — расчётная оценка на основе введённых данных. Не является финансовой рекомендацией.</span><span className="footer-kz">Сделано для Казахстана <span>✳</span></span></div></footer>
  </div>
}

export default App
