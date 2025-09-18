import React from 'react';
import type { AnalysisResult, Performer } from '../types';
import TrendChart from './TrendChart';

interface AnalysisDisplayProps {
  analysis: AnalysisResult;
  onReset: () => void;
  reportName: string;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <section className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
    <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
      <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-sky-100 text-sky-600 rounded-lg">{icon}</span>
      {title}
    </h3>
    {children}
  </section>
);

const PerformerCard: React.FC<{ performer: Performer; type: 'top' | 'bottom' }> = ({ performer, type }) => {
    const isTop = type === 'top';
    const borderColor = isTop ? 'border-green-400' : 'border-red-400';
    const bgColor = isTop ? 'bg-green-50' : 'bg-red-50';
    const textColor = isTop ? 'text-green-800' : 'text-red-800';

    return (
        <div className={`p-4 rounded-md border-l-4 ${borderColor} ${bgColor}`}>
            <p className="font-bold text-sm text-slate-800 truncate" title={performer.name}>{performer.name}</p>
            <p className="text-slate-600 text-xs mt-1">{performer.description}</p>
            <div className={`mt-2 text-xs font-semibold ${textColor}`}>
                {performer.metric}: {performer.value}
            </div>
        </div>
    );
};


const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, onReset, reportName }) => {
  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-slate-800">
          Performance Analysis for <span className="text-sky-600">{reportName}</span>
        </h2>
      </div>

      <div className="space-y-8">
        <Section title="Executive Summary" icon={<IconStar />}>
          <p className="text-slate-700 leading-relaxed">{analysis.executiveSummary}</p>
        </Section>

        <section className="bg-white p-6 rounded-lg shadow-md border border-slate-200">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <span className="flex-shrink-0 h-8 w-8 flex items-center justify-center bg-sky-100 text-sky-600 rounded-lg"><IconSparkles /></span>
                KPI Highlights
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-md">
                    <h4 className="font-semibold text-green-800 flex items-center mb-2 gap-2">
                        <IconThumbsUp /> What Went Well
                    </h4>
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                        {analysis.kpiHighlights.positive.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-md">
                    <h4 className="font-semibold text-red-800 flex items-center mb-2 gap-2">
                        <IconThumbsDown /> Areas for Improvement
                    </h4>
                    <ul className="space-y-2 list-disc list-inside text-sm text-slate-600">
                        {analysis.kpiHighlights.negative.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </div>
            </div>
        </section>

        {analysis.kpiTrends && analysis.kpiTrends.length > 0 && (
            <Section title="KPI Trends" icon={<IconTrendingUp />}>
                <TrendChart trends={analysis.kpiTrends} />
            </Section>
        )}
        
        <Section title="Performance Spotlight" icon={<IconSearch />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><IconCheckCircle /> Top Performers</h4>
                    <div className="space-y-3">
                        {analysis.topPerformers.map((p, i) => <PerformerCard key={i} performer={p} type="top" />)}
                    </div>
                </div>
                 <div>
                    <h4 className="font-semibold text-slate-700 mb-3 flex items-center gap-2"><IconXCircle /> Bottom Performers</h4>
                    <div className="space-y-3">
                        {analysis.bottomPerformers.map((p, i) => <PerformerCard key={i} performer={p} type="bottom" />)}
                    </div>
                </div>
            </div>
        </Section>


        <Section title="Benchmark Comparison" icon={<IconChart />}>
          <p className="text-slate-700 leading-relaxed">{analysis.benchmarkComparison}</p>
        </Section>

        <Section title="Actionable Recommendations" icon={<IconClipboardCheck />}>
          <ul className="space-y-3 list-disc list-inside text-slate-700">
            {analysis.actionableRecommendations.map((rec, index) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </Section>

        <Section title="Petco Marketplace Context" icon={<IconGlobe />}>
          <p className="text-slate-700 leading-relaxed">{analysis.petcoContextualization}</p>
        </Section>
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={onReset}
          className="px-8 py-2 text-base font-semibold text-sky-600 bg-white border border-sky-500 rounded-lg shadow-sm hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 transition-all duration-200"
        >
          Analyze More Reports
        </button>
      </div>
    </div>
  );
};

// --- ICONS ---
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>;
const IconSparkles = () => <svg xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.51l-.219.684-.219-.684a2.25 2.25 0 00-1.406-1.406l-.684-.219.684-.219a2.25 2.25 0 001.406-1.406l.219-.684.219.684a2.25 2.25 0 001.406 1.406l.684.219-.684.219a2.25 2.25 0 00-1.406 1.406z" /></svg>;
const IconThumbsUp = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M6.633 10.5l-1.822 1.822a2.25 2.25 0 00-3.183 3.183l1.822-1.822m3.183 0l-1.822 1.822a2.25 2.25 0 003.183 3.183l1.822-1.822" /></svg>;
const IconThumbsDown = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M7.863 10.5l-1.822 1.822a2.25 2.25 0 00-3.183 3.183l1.822-1.822m3.183 0l-1.822 1.822a2.25 2.25 0 003.183 3.183l1.822-1.822m-5.127-6.248c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H9.332c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H1.5" /></svg>;
const IconChart = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3.75h16.5M12 3v13.5m-7.5 0h15" /></svg>;
const IconTrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-3.75-.625m3.75.625V3.375" /></svg>;
const IconClipboardCheck = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 019 9v.375M10.125 2.25A3.375 3.375 0 0113.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 013.375 3.375M9 15l2.25 2.25L15 12" /></svg>;
const IconGlobe = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const IconSearch = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
const IconCheckCircle = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const IconXCircle = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

export default AnalysisDisplay;
