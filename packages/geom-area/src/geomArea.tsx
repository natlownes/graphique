import React, { useEffect, useMemo, SVGAttributes, useState } from 'react'
import {
  useGG,
  themeState,
  generateID,
  EventArea,
  Aes,
  DataValue,
  isDate,
  widen,
  yScaleState,
  zoomState,
  defineGroupAccessor,
  defaultScheme,
  fillScaleState,
  strokeScaleState,
  VisualEncodingTypes,
  BrushAction,
} from '@graphique/graphique'
import { Animate } from 'react-move'
import { easeCubic } from 'd3-ease'
import { scaleOrdinal } from 'd3-scale'
import { interpolate } from 'd3-interpolate'
import { interpolatePath } from 'd3-interpolate-path'
import {
  area,
  CurveFactory,
  curveLinear,
  stack,
  stackOffsetDiverging,
  stackOffsetExpand,
  // stackOffsetWiggle,
  // stackOrderInsideOut,
  stackOrderNone,
} from 'd3-shape'
import { min, max, sum, extent } from 'd3-array'
import { useAtom } from 'jotai'
import type { GeomAes, StackedArea } from './types'
import { LineMarker, Tooltip } from './tooltip'

export interface GeomAreaProps extends SVGAttributes<SVGPathElement> {
  data?: unknown[]
  aes?: GeomAes
  showTooltip?: boolean
  brushAction?: BrushAction
  curve?: CurveFactory
  markerRadius?: number
  markerStroke?: string
  onDatumFocus?: (data: unknown, index: number[]) => void
  onDatumSelection?: (data: unknown, index: number[]) => void
  onExit?: () => void
  fillOpacity?: number
  strokeOpacity?: number
  // TODO: add 'stream' position
  position?: 'identity' | 'stack' | 'fill'
}

const GeomArea = ({
  data: localData,
  aes: localAes,
  showTooltip = true,
  brushAction,
  curve,
  onDatumFocus,
  onDatumSelection,
  // focusedStyle,
  // unfocusedStyle,
  onExit,
  fillOpacity = 1,
  strokeOpacity = 1,
  strokeWidth = 0,
  markerRadius = 3.5,
  markerStroke = '#fff',
  position = 'identity',
  ...props
}: GeomAreaProps) => {
  const { ggState } = useGG() || {}
  const { id, data, aes, scales, copiedScales } = ggState || {}
  const [theme, setTheme] = useAtom(themeState)
  const [{ values: fillScaleColors, domain: fillDomain }] =
    useAtom(fillScaleState)
  const [{ values: strokeScaleColors, domain: strokeDomain }] =
    useAtom(strokeScaleState)
  const [{ isFixed, domain: yDomain }, setYScale] = useAtom(yScaleState)
  const [{ yDomain: yZoomDomain }, setZoom] = useAtom(zoomState)

  const geomData = localData || data
  const geomAes = useMemo(() => {
    if (localAes) {
      return {
        ...aes,
        ...localAes,
      } as GeomAes
    }
    return aes as GeomAes
  }, [aes, localAes])

  const allXUndefined = useMemo(() => {
    const undefinedX = geomData
      ? geomData.filter(
          (d) =>
            geomAes?.x &&
            (geomAes?.x(d) === null ||
              typeof geomAes?.x(d) === 'undefined' ||
              Number.isNaN(geomAes.x(d)?.valueOf()) ||
              (isDate(geomAes.x(d)) && geomAes.x(d)?.valueOf() === 0))
        )
      : []
    return geomData && undefinedX.length === geomData.length
  }, [geomData, geomAes])

  const allYUndefined = useMemo(() => {
    const undefinedY = geomData
      ? geomData.filter(
          (d) =>
            (!geomAes.y0 &&
              !geomAes.y1 &&
              geomAes?.y &&
              (geomAes.y(d) === null ||
                typeof geomAes.y(d) === 'undefined' ||
                Number.isNaN(geomAes.y(d)?.valueOf()))) ||
            (geomAes.y0 &&
              (geomAes.y0(d) === null ||
                typeof geomAes.y0(d) === 'undefined' ||
                Number.isNaN(geomAes.y0(d)?.valueOf()))) ||
            (geomAes.y1 &&
              (geomAes.y1(d) === null ||
                typeof geomAes.y1(d) === 'undefined' ||
                Number.isNaN(geomAes.y1(d)?.valueOf())))
        )
      : []
    return geomData && undefinedY.length === geomData.length
  }, [geomData])

  const {
    fill: fillColor,
    stroke: strokeColor,
    strokeDasharray,
    // strokeWidth,
  } = { ...props }
  const { defaultFill, defaultStroke, animationDuration: duration } = theme

  const geomID = useMemo(() => generateID(), [])

  const [firstRender, setFirstRender] = useState(true)

  useEffect(() => {
    const timeout = setTimeout(() => setFirstRender(false), 0)
    return () => clearTimeout(timeout)
  }, [])

  // draw an area for each registered group
  // get groups from aes.group || aes.stroke || aes.strokeDasharray?
  const group = useMemo(
    () =>
      geomAes?.group || geomAes?.fill
        ? defineGroupAccessor(geomAes as Aes)
        : scales?.groupAccessor,
    [geomAes, defineGroupAccessor]
  )

  const groups = useMemo(
    () =>
      group
        ? (Array.from(new Set(geomData?.map(group))) as string[])
        : undefined,
    [geomData, group]
  )

  const fillGroups = useMemo(
    () =>
      geomAes?.fill
        ? (Array.from(new Set(geomData?.map(geomAes.fill))) as string[])
        : undefined,
    [geomAes]
  )

  const strokeGroups = useMemo(
    () =>
      geomAes?.stroke
        ? (Array.from(new Set(geomData?.map(geomAes.stroke))) as string[])
        : undefined,
    [geomAes]
  )

  const x = useMemo(
    () => (d: unknown) =>
      geomAes?.x && scales?.xScale && scales.xScale(geomAes?.x(d)),
    [scales, geomAes]
  )
  const y = useMemo(
    () => (d: unknown) =>
      geomAes?.y && scales?.yScale && scales.yScale(geomAes?.y(d)),
    [scales, geomAes]
  )

  const shouldStack = useMemo(
    () => ['stack', 'fill', 'stream'].includes(position),
    [position]
  )

  const yValExtent = useMemo(() => {
    // reset the yScale based on position
    // const existingYExtent = scales?.yScale?.domain() as [number, number]
    const existingYExtent = [0, 1]

    let resolvedYExtent = [0, 1]
    if (!group && !groups && !geomAes.y0 && !geomAes.y1)
      resolvedYExtent = [0, existingYExtent[1]]
    if (!group && !groups) resolvedYExtent = existingYExtent
    if (
      // shouldStack &&
      group &&
      groups &&
      geomData &&
      scales?.xScale &&
      geomAes?.x
    ) {
      const groupYMaximums = groups.map((g) =>
        max(
          geomData.filter((d) => group(d) === g),
          (d) => {
            const thisYAcc = !shouldStack
              ? geomAes.y1 || geomAes.y || (() => undefined)
              : geomAes.y || (() => undefined)
            return thisYAcc(d) as number
          }
        )
      )

      const groupYMinimums = groups.map((g) =>
        min(
          geomData.filter((d) => group(d) === g),
          (d) => {
            const thisYAcc = geomAes.y0 || (() => undefined)
            return thisYAcc(d) as number
          }
        )
      )

      if (['stack', 'stream'].includes(position)) {
        const totalGroupYMaximums = max([
          sum(groupYMaximums),
          existingYExtent[1],
        ])

        return [0, totalGroupYMaximums]
      }
      if (position === 'fill') return [0, 1]
      // if (!geomAes.y0 && !geomAes.y1)
      //   return [0, max(groupYMaximums as number[])]

      if (position === 'identity') {
        const identityYVals: (number | undefined)[][] | undefined =
          geomData?.map((d) => {
            const yVal = geomAes?.y ? (geomAes.y(d) as number) : undefined
            const y0Val = geomAes?.y0 ? (geomAes.y0(d) as number) : undefined
            const y1Val = geomAes?.y1 ? (geomAes.y1(d) as number) : undefined
            return [yVal, y0Val, y1Val]
          })

        const yExtent = identityYVals
          ? (extent(identityYVals.flat() as number[]) as [number, number])
          : [0, 1]

        const yMin =
          geomAes?.y0 && geomAes?.y1 && !geomAes.y
            ? min(
                [
                  groupYMinimums as number[],
                  // existingYExtent[0],
                  // yExtent[0],
                ].flat()
              )
            : min([0, yExtent[0] as number])

        const yMax = max([
          !geomAes.y0 && !geomAes.y1 && 0,
          max(
            [
              groupYMaximums as number[],
              existingYExtent[1] as number,
              // yExtent[1] as number,
            ].flat()
          ),
        ] as number[])

        resolvedYExtent = [yMin, yMax] as [number, number]
      }
    }
    return resolvedYExtent
  }, [position, geomData, geomAes])

  useEffect(() => {
    if (firstRender) {
      setYScale((prev) => ({
        ...prev,
        domain: yZoomDomain?.current ?? (isFixed ? yDomain : yValExtent),
      }))
      if (!yZoomDomain?.original) {
        setZoom((prev) => ({
          ...prev,
          yDomain: {
            ...prev.yDomain,
            original: isFixed ? yDomain : yValExtent,
          },
        }))
      }
    }
  }, [yValExtent, isFixed, firstRender, yDomain, yZoomDomain])

  const y0 = useMemo(
    () => (d: unknown) =>
      geomAes?.y0 && scales?.yScale && scales.yScale(geomAes.y0(d)),
    [scales, geomAes]
  ) as DataValue

  const y1 = useMemo(
    () => (d: unknown) =>
      geomAes?.y1 && scales?.yScale && scales.yScale(geomAes.y1(d)),
    [scales, geomAes]
  ) as DataValue

  const drawStackArea = useMemo(
    () =>
      area()
        .x((d: any) => scales?.xScale(d.x) as number)
        .y0((d: any) => scales?.yScale(d.y0) as number)
        .y1((d: any) => scales?.yScale(d.y1) as number)
        .defined((d: any) => {
          const dataVal: StackedArea = d
          const xVal = isDate(dataVal.x) ? dataVal.x.valueOf() : dataVal.x

          const areDefined =
            typeof xVal !== 'undefined' &&
            typeof dataVal.y0 !== 'undefined' &&
            typeof dataVal.y1 !== 'undefined'

          const areNumbers =
            !Number.isNaN(xVal) &&
            !Number.isNaN(dataVal.y0) &&
            !Number.isNaN(dataVal.y1)

          return areDefined && areNumbers
        })
        .curve(curve || curveLinear),
    [curve, scales, geomAes, localAes, yValExtent]
  )

  const drawArea = useMemo(
    () =>
      area()
        .x((d) => x(d) as number)
        .y0((d) => (localAes?.y0 ? (y0(d) as number) : scales?.yScale(0)))
        .y1((d: any) => (localAes?.y1 ? (y1(d) as number) : (y(d) as number)))
        .defined((d) => {
          const xVal =
            geomAes.x &&
            (isDate(geomAes.x(d)) ? geomAes.x(d)?.valueOf() : geomAes.x(d))

          const y0Val =
            geomAes.y0 && geomAes.y1 ? geomAes.y0(d) : geomAes.y && geomAes.y(d)
          const y1Val =
            geomAes.y0 && geomAes.y1 ? geomAes.y1(d) : geomAes.y && geomAes.y(d)

          const areDefined =
            typeof xVal !== 'undefined' &&
            typeof y0Val !== 'undefined' &&
            y0Val !== null &&
            typeof y1Val !== 'undefined' &&
            y1Val !== null

          const areNumbers =
            !Number.isNaN(xVal) && !Number.isNaN(y0Val) && !Number.isNaN(y1Val)

          return areDefined && areNumbers
        })
        .curve(curve || curveLinear),
    [curve, geomAes, localAes, scales, yValExtent]
  )

  // merge GG-level scales with Geom-level scales

  const geomFillScale = useMemo(() => {
    if (groups && geomAes.fill) {
      return scaleOrdinal()
        .domain(fillDomain || fillGroups || groups)
        .range(
          (fillScaleColors as string[]) || defaultScheme
        ) as VisualEncodingTypes
    }
    return undefined
  }, [geomAes, fillScaleColors, fillDomain])

  const geomStrokeScale = useMemo(() => {
    if (groups && geomAes.stroke) {
      return scaleOrdinal()
        .domain(strokeDomain || strokeGroups || groups)
        .range(
          (strokeScaleColors as string[]) || defaultScheme
        ) as VisualEncodingTypes
    }
    return undefined
  }, [geomAes])

  useEffect(() => {
    setTheme((prev) => ({
      ...prev,
      geoms: {
        ...prev.geoms,
        area: {
          position,
          fillOpacity: props.style?.fillOpacity || fillOpacity,
          stroke: strokeColor,
          fill: fillColor,
          fillScale: geomFillScale,
          strokeScale: geomStrokeScale,
          groupAccessor: group,
          usableGroups: groups,
          y0,
          y1,
          strokeWidth: props.style?.strokeWidth || strokeWidth,
          strokeOpacity: props.style?.strokeOpacity || strokeOpacity,
          strokeDasharray: props.style?.strokeDasharray || strokeDasharray,
        },
      },
    }))
  }, [
    fillOpacity,
    setTheme,
    strokeWidth,
    strokeOpacity,
    strokeDasharray,
    strokeColor,
    fillColor,
    props.style,
    position,
    shouldStack,
    group,
  ])

  const stackOffset = useMemo(() => {
    if (position === 'fill') return stackOffsetExpand
    // if (position === 'stream') return stackOffsetWiggle
    return stackOffsetDiverging
  }, [position])

  const stackOrder = useMemo(
    () =>
      // if (position === 'stream') return stackOrderInsideOut
      stackOrderNone,
    [position]
  )

  const stackedData = useMemo(() => {
    if (
      geomData &&
      geomAes?.x &&
      geomAes?.y &&
      shouldStack &&
      group &&
      groups
    ) {
      const stacked = stack()
        .keys(groups)
        .order(stackOrder)
        .offset(stackOffset)(widen(geomData, geomAes.x, group, geomAes.y))

      const formattedStacked = stacked
        .map((s) => {
          const thisGroup = s.key
          return s
            .map((thisStack) => ({
              group: thisGroup,
              x: thisStack.data.key,
              y0: thisStack[0],
              y1: thisStack[1],
            }))
            .flat()
        })
        .flat()
        .sort((a, b) => a.x - b.x)

      return formattedStacked
    }
    return null
  }, [geomData, geomAes, shouldStack, stackOffset, stackOrder])

  const getStackedData = useMemo(
    () => (g: unknown) => {
      const thisStack =
        stackedData && stackedData.filter((sd) => sd.group === g)

      return thisStack
    },
    [stackedData, scales, geomAes, position]
  )

  // map through groups to draw an area for each group
  return !firstRender && !allXUndefined && !allYUndefined ? (
    <>
      {geomData && groups && group ? (
        groups.map((g) => {
          const groupData = geomData.filter((d) => group(d) === g)
          const groupStack = getStackedData(g)

          const thisFillGroups =
            geomFillScale && geomAes?.fill
              ? Array.from(
                  new Set(
                    groupData.map((gd) => geomAes.fill && geomAes.fill(gd))
                  )
                )
              : undefined

          let thisFill =
            fillColor ||
            (geomFillScale && geomFillScale(g)) ||
            (copiedScales?.fillScale ? copiedScales.fillScale(g) : defaultFill)

          if (thisFillGroups && geomFillScale) {
            thisFillGroups.forEach((fg) => {
              thisFill = geomFillScale(fg)
            })
          }

          const thisStrokeGroups =
            geomStrokeScale && geomAes?.stroke
              ? Array.from(
                  new Set(
                    groupData.map((gd) => geomAes.stroke && geomAes.stroke(gd))
                  )
                )
              : undefined

          let thisStroke =
            strokeColor ||
            (geomStrokeScale && geomStrokeScale(g)) ||
            (copiedScales?.strokeScale
              ? copiedScales.strokeScale(g)
              : defaultStroke)

          if (thisStrokeGroups && geomStrokeScale) {
            thisStrokeGroups.forEach((fg) => {
              thisStroke = geomStrokeScale(fg)
            })
          }

          const thisDasharray =
            strokeDasharray ||
            (copiedScales?.strokeDasharrayScale
              ? copiedScales.strokeDasharrayScale(g)
              : strokeDasharray)

          return (
            <Animate
              key={`${geomID}-${g}`}
              start={{
                path: shouldStack
                  ? // @ts-ignore
                    drawStackArea(groupStack)
                  : // @ts-ignore
                    drawArea(groupData),
                fill: 'transparent',
                stroke: 'transparent',
                strokeOpacity: 0,
                fillOpacity: 0,
              }}
              enter={{
                path: shouldStack
                  ? // @ts-ignore
                    [drawStackArea(groupStack)]
                  : // @ts-ignore
                    [drawArea(groupData)],
                fill: [thisFill],
                stroke: [thisStroke],
                fillOpacity: [fillOpacity],
                strokeOpacity: [strokeOpacity],
                timing: { duration, ease: easeCubic },
              }}
              update={{
                path: shouldStack
                  ? // @ts-ignore
                    [drawStackArea(groupStack)]
                  : // @ts-ignore
                    [drawArea(groupData)],
                fill: firstRender ? thisFill : [thisFill],
                stroke: firstRender ? thisStroke : [thisStroke],
                fillOpacity: [fillOpacity],
                strokeOpacity: [strokeOpacity],
                timing: {
                  duration,
                  ease: easeCubic,
                },
              }}
              leave={() => ({
                fill: ['transparent'],
                stroke: ['transparent'],
                timing: { duration, ease: easeCubic },
              })}
              interpolation={(begValue, endValue, attr) => {
                if (attr === 'path') {
                  return interpolatePath(begValue, endValue)
                }
                return interpolate(begValue, endValue)
              }}
            >
              {(state) => (
                <path
                  d={state.path}
                  fill={state.fill}
                  fillOpacity={state.fillOpacity}
                  stroke={state.stroke}
                  strokeOpacity={state.strokeOpacity}
                  strokeWidth={strokeWidth}
                  strokeDasharray={thisDasharray}
                  style={{
                    pointerEvents: 'none',
                  }}
                  data-testid="__gg_geom_area"
                  clipPath={`url(#__gg_canvas_${id})`}
                  // eslint-disable-next-line react/jsx-props-no-spreading
                  {...props}
                />
              )}
            </Animate>
          )
        })
      ) : (
        <Animate
          start={{
            // @ts-ignore
            path: drawArea(geomData),
            fill: 'transparent',
            stroke: 'transparent',
            strokeOpacity: 0,
            fillOpacity: 0,
          }}
          enter={{
            // @ts-ignore
            path: [drawArea(geomData)],
            fill: [fillColor || defaultFill],
            stroke: [strokeColor || defaultStroke],
            fillOpacity: [fillOpacity],
            strokeOpacity: [strokeOpacity],
            timing: { duration },
          }}
          update={{
            // @ts-ignore
            path: [drawArea(geomData)],
            fill: [fillColor || defaultFill],
            stroke: [strokeColor || defaultStroke],
            fillOpacity: firstRender ? fillOpacity : [fillOpacity],
            strokeOpacity: firstRender ? strokeOpacity : [strokeOpacity],
            timing: { duration, ease: easeCubic },
          }}
          leave={() => ({
            fill: ['transparent'],
            stroke: ['transparent'],
            timing: { duration, ease: easeCubic },
          })}
          interpolation={(begValue, endValue, attr) => {
            if (attr === 'path') {
              return interpolatePath(begValue, endValue)
            }
            return interpolate(begValue, endValue)
          }}
        >
          {(state) => (
            <path
              d={state.path}
              fill={state.fill}
              fillOpacity={state.fillOpacity}
              stroke={state.stroke}
              strokeWidth={strokeWidth}
              strokeOpacity={state.strokeOpacity}
              data-testid="__gg_geom_area"
              clipPath={`url(#__gg_canvas_${id})`}
              // eslint-disable-next-line react/jsx-props-no-spreading
              {...props}
            />
          )}
        </Animate>
      )}
      {(showTooltip || brushAction) && (
        <>
          <EventArea
            data={geomData}
            aes={geomAes}
            group="x"
            x={x}
            y={() => 0}
            onDatumFocus={onDatumFocus}
            onMouseLeave={() => {
              if (onExit) onExit()
            }}
            onClick={
              onDatumSelection
                ? ({ d, i }: { d: any; i: number[] }) => {
                    onDatumSelection(d, i)
                  }
                : undefined
            }
            showTooltip={showTooltip}
            brushAction={brushAction}
          />
          {showTooltip && (
            <>
              <LineMarker
                x={x}
                y={y}
                y0={y0}
                y1={y1}
                aes={geomAes}
                markerRadius={markerRadius}
                markerStroke={markerStroke}
              />
              <Tooltip
                x={x}
                y={y}
                y0={y0}
                y1={y1}
                aes={geomAes}
                group={group}
                geomID={geomID}
              />
            </>
          )}
        </>
      )}
    </>
  ) : null
}

GeomArea.displayName = 'GeomArea'
export { GeomArea }
