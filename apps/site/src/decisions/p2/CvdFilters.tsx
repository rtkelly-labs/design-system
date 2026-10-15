import { CVD_MATRIX } from './colour';

const values = (m: readonly (readonly number[])[]) =>
  [...m.map((row) => `${row.join(' ')} 0 0`), '0 0 0 1 0'].join(' ');

/** SVG colour-blindness filters, referenced by `filter: url(#p2-cvd-<name>)`. */
export function CvdFilters() {
  return (
    <svg aria-hidden="true" focusable="false" width="0" height="0" className="absolute">
      <defs>
        {(Object.keys(CVD_MATRIX) as (keyof typeof CVD_MATRIX)[]).map((k) => (
          <filter key={k} id={`p2-cvd-${k}`} colorInterpolationFilters="linearRGB">
            <feColorMatrix type="matrix" values={values(CVD_MATRIX[k])} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
