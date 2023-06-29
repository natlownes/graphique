/* eslint-disable import/no-extraneous-dependencies */
import React from 'react'
import {
  GG,
  ScaleRadius,
  ScaleX,
} from '@graphique/graphique'
import { GeomCol, Legend as ColLegend } from '@graphique/geom-col'
import { GeomBar } from '@graphique/geom-bar'
import {
  GeomPoint,
  Legend as PointLegend,
  SizeLegend
} from '@graphique/geom-point'
import {
  penguins,
  Penguin,
  crimes,
  Crime
} from '@graphique/datasets'

const totalsByOffenseAndHour = crimes.reduce((acc, p: Crime) => {
  const hr = acc[p.hr] || {};
  const total = (hr[p.offenseCategory] || 0) + p.count;
  acc[p.hr] = hr;
  acc[p.hr][p.offenseCategory] = total;
  return acc;
}, {} as {[k: string]: {[k: string]: number}})

const totalsByOffense: {[k: string]: number} = crimes.reduce((acc, p) => {
  const total = acc[p.offenseCategory] || 0;
  acc[p.offenseCategory] = total + p.count;
  return acc
}, {} as {[k: string]: number})

const scaleFormat = (props: {value: any, index: number, width: number}) => {
  const {value}: {value: string} = props
  return value
}

const ExampleContainer = (props: {children: React.ReactNode}) => {
  const {children} = props
  return (
    <div style={{
      marginLeft: '100px',
      height: '650px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {children}
    </div>
  )
}

const PointPlotExample = () => (
  <ExampleContainer>
    <h2>Point Plot Example</h2>
    <div>
      <GG
        data={penguins}
        aes={{
          x: (d: Penguin) => d.flipperLength,
          y: (d: Penguin) => d.bodyMass,
          fill: (d: Penguin) => d.species,
        }}
        margin={{ left: 100 }}
      >
        <GeomPoint
          isClipped={false}
          aes={{
            size: (d: Penguin) => d.beakDepth
          }}
          opacity={0.6}
        />
        <PointLegend />
        <SizeLegend />
        <ScaleRadius range={[3, 25]} />
      </GG>
    </div>
  </ExampleContainer>
)


const BarYExample = () => {
  const rows: Array<Partial<Crime>> = Object.keys(totalsByOffense).map((cat) => (
    {'offenseCategory': cat, count: totalsByOffense[cat]}
  ))
  return(
    <ExampleContainer>
      <h2>Bar Y-Axis Example</h2>
      <div>
        <h3>Crimes, Total</h3>
        <GG
          data={rows}
          aes={{
            x: (d: Crime) => d.offenseCategory,
            y: (d: Crime) => d.count,
          }}
          margin={{ left: 100 }}
          width={600}
        >
          <GeomCol
            opacity={0.8}
          />
        </GG>
      </div>
    </ExampleContainer>
  )
}

const BarXExample = () => {
  const rows: Array<Partial<Crime>> = Object.keys(totalsByOffense).map((cat) => (
    {'offenseCategory': cat, count: totalsByOffense[cat]}
  ))
  return(
    <ExampleContainer>
      <h2>Bar X-Axis Example</h2>
      <div>
        <h3>Crimes, Total</h3>
        <GG
          data={rows}
          aes={{
            x: (d: Crime) => d.count,
            y: (d: Crime) => d.offenseCategory,
          }}
          margin={{ left: 100 }}
          width={600}
        >
          <GeomBar
            opacity={0.8}
          />
        </GG>
      </div>
    </ExampleContainer>
  )
}

const BarYStackedExample = () => {
  const rows: Array<Partial<Crime>> = Object.keys(totalsByOffenseAndHour).reduce((acc, hr) => (
    acc.concat(Object.keys(totalsByOffenseAndHour[hr]).map((cat) => (
      {
        'offenseCategory': cat,
        'count': totalsByOffenseAndHour[hr][cat],
        'hr': hr
      }
    )))
  ), [] as Array<Partial<Crime>>)
  return (
    <ExampleContainer>
      <h2>Bar Stacked Y-Axis Example</h2>
      <div>
        <h3>Crimes, Total by Hour</h3>
        <GG
          data={rows}
          aes={{
            x: (d: Crime) => d.hr,
            y: (d: Crime) => d.count,
            fill: (d: Crime) => d.offenseCategory
          }}
          margin={{ left: 100 }}
          width={800}
        >
          <GeomCol
            opacity={0.8}
            width={20}
          />
          <ScaleX format={scaleFormat} />
          <ColLegend orientation='horizontal' />
        </GG>
      </div>
    </ExampleContainer>
  )
}

function App() {
  return (
    <div style={{ maxWidth: 1200, padding: '0 10px' }}>
      <PointPlotExample />
      <BarXExample />
      <BarYExample />
      <BarYStackedExample />
    </div>
  )
}

export default App
