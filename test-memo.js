const fs = require('fs');
const file = 'frontend/src/components/sauna-map/components/map/VisitMarkers.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'import { memo, useCallback } from "react";',
  'import { memo, useCallback, useMemo } from "react";'
);

content = content.replace(
  `  const priorityVisits: SaunaVisit[] = [];
  const normalVisits: SaunaVisit[] = [];

  visits.forEach((visit) => {
    const isSelected = visit.id === selectedId || visit.id === editingId;
    if (isSelected || isWishlist(visit)) {
      priorityVisits.push(visit);
    } else {
      normalVisits.push(visit);
    }
  });`,
  `  const { priorityVisits, normalVisits } = useMemo(() => {
    const priority: SaunaVisit[] = [];
    const normal: SaunaVisit[] = [];

    visits.forEach((visit) => {
      const isSelected = visit.id === selectedId || visit.id === editingId;
      if (isSelected || isWishlist(visit)) {
        priority.push(visit);
      } else {
        normal.push(visit);
      }
    });

    return { priorityVisits: priority, normalVisits: normal };
  }, [visits, selectedId, editingId]);`
);

fs.writeFileSync(file, content);
