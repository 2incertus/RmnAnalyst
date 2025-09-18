export interface TrendDataPoint {
  period: string;
  value: number;
}

export interface KpiTrend {
  metric: string;
  data: TrendDataPoint[];
}

export interface Performer {
  name: string;
  metric: string;
  value: string;
  description: string;
}

export interface AnalysisResult {
  executiveSummary: string;
  kpiHighlights: {
    positive: string[];
    negative: string[];
  };
  benchmarkComparison: string;
  kpiTrends: KpiTrend[];
  topPerformers: Performer[];
  bottomPerformers: Performer[];
  actionableRecommendations: string[];
  petcoContextualization: string;
}

export enum PageState {
  INITIAL = 'INITIAL',
  ANALYZING = 'ANALYZING',
  RESULTS = 'RESULTS',
  ERROR = 'ERROR',
}
