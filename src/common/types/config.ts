interface SequenceInfo {
  last_value: number;
  min_value: number;
  max_value: number;
  increment_by: number;
}

interface TableWithSequence {
  tableName: string;
  sequence: SequenceInfo | null;
}


export type { SequenceInfo, TableWithSequence }