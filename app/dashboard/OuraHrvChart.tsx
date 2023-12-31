'use client'
import React, { useEffect, useState } from 'react';
import Plot from 'react-plotly.js';
import { Session, createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { ArrowPathIcon } from '@heroicons/react/20/solid';
import { Button } from '@/components/ui/button';
import { GetStatesWithFunctionOptions } from '../supabase-server';
import { LLMInsights } from './LLMInsights';
import posthog from 'posthog-js';
import { State, Tag } from '@/utils/extended-types';

interface Props {
    session: Session;
}

export const getTags = async (userId: string) => {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
        .from('tags')
        .select('text, created_at')
        .eq('user_id', userId)
        .gt('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())

    if (error) {
        console.log(error.message);
    }
    return data || [];
};

export const getHrvs = async (userId: string) => {
    const supabase = createClientComponentClient();
    const { data, error } = await supabase
        .from('states')
        .select('oura->>sleep, oura->>day')
        .gte('oura->>day', '')
        .eq('user_id', userId)

    if (error) {
        console.log(error.message);
    }
    return data || [];
};

export const OuraHrvChart = ({ session }: Props) => {
    let [states, setStates] = useState<any[]>([]);
    const [tags, setTags] = useState<{
        text: string | null;
        created_at: string | null;
    }[]>([]);

    console.log('hrvs', states);
    const refreshState = async () => {
        if (!session?.user?.id) return

        const ns = await getHrvs(session.user.id);
        setStates(ns);
        const nt = await getTags(session.user.id);
        setTags(nt);

        posthog.capture('refresh-state');
    }

    useEffect(() => {
        refreshState();
    }, []);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
    };

    const sleepScores = states
        .filter((state) => state?.['sleep'])
        .map((state) => {
            // @ts-ignore
            const sleepData = JSON.parse(state?.['sleep'])[0];
            // @ts-ignore
            const sleepDay = state?.['day'];
            if (!sleepData) return null;
            return {
                date: sleepDay, // this will be used for sorting
                day: formatDate(sleepDay),
                score: sleepData.average_hrv,
            };
        }).filter((s) => s !== null)
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()); // sort by the date


    // Sleep score data series
    const sleepScoreData = {
        x: sleepScores.map(data => data!.day),
        y: sleepScores.map(data => data!.score),
        type: 'scatter',
        mode: 'lines+markers',
        marker: { color: '#48bb78' },
        name: 'Heart Rate Variability'
    };

    const layout = {
        title: 'Heart rate variability',
        xaxis: {
            title: 'Day',
            tickformat: "%b %d, %Y"
        },
        yaxis: {
            title: 'HRV',
            range: [0, 100]
        }
    };


    return (
        <div className="relative flex flex-col p-4 rounded-lg shadow-lg">
            <Button
                onClick={refreshState}
                variant="secondary"
                className="absolute top-0 left-50 mt-2 mr-2 z-10 bg-white"
            >
                <ArrowPathIcon
                    width={20}
                    height={20}
                />
            </Button>
            <div className="flex flex-col space-y-4">
                <Plot
                    // @ts-ignore
                    data={[sleepScoreData]}
                    // @ts-ignore
                    layout={layout}
                    style={{
                        width:
                            // small on mobile
                            window.innerWidth < 640 ? "300px" :
                                "600px",
                        height:
                            window.innerWidth < 640 ? "200px" :
                                "300px"
                    }}
                    config={{
                        displayModeBar: true,
                        modeBarButtons: [['zoom2d', 'zoomIn2d', 'zoomOut2d', 'autoScale2d', 'resetScale2d']],
                    }}
                />
                <LLMInsights states={
                    // mostly hrv scores
                    states.map((state) => JSON.parse(state.sleep)?.[0]?.hrv)
                } tags={tags} />
            </div>
        </div>
    );
}
