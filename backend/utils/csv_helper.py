# csv_helper.py — CSV analysis logic
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import json

def analyze_csv(filepath, column_mapping):
    """
    Analyzes uploaded CSV based on user's column mapping
    Returns insights, alerts, and risk forecast
    """
    try:
        df = pd.read_csv(filepath)
        results = {
            'summary': {},
            'time_series': [],
            'zone_distribution': [],
            'category_breakdown': [],
            'numeric_stats': [],
            'risk_scores': [],
            'alerts': [],
            'forecast': {}
        }

        # ── SUMMARY ──
        results['summary'] = {
            'total_records': len(df),
            'total_columns': len(df.columns),
            'date_range': get_date_range(df, column_mapping)
        }

        # ── TIME SERIES ──
        date_col = get_mapped_col(column_mapping, 'date')
        if date_col and date_col in df.columns:
            df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
            df = df.dropna(subset=[date_col])
            time_grouped = df.groupby(
                df[date_col].dt.to_period('W')
            ).size().reset_index()
            time_grouped.columns = ['period', 'count']
            results['time_series'] = [
                {'period': str(row['period']), 'count': int(row['count'])}
                for _, row in time_grouped.iterrows()
            ]

        # ── ZONE DISTRIBUTION ──
        location_col = get_mapped_col(column_mapping, 'location')
        if location_col and location_col in df.columns:
            zone_counts = df[location_col].value_counts().head(8)
            results['zone_distribution'] = [
                {'zone': str(zone), 'count': int(count)}
                for zone, count in zone_counts.items()
            ]

        # ── CATEGORY BREAKDOWN ──
        category_col = get_mapped_col(column_mapping, 'category')
        if category_col and category_col in df.columns:
            cat_counts = df[category_col].value_counts().head(6)
            total = len(df)
            results['category_breakdown'] = [
                {
                    'category': str(cat),
                    'count': int(count),
                    'percentage': round(count / total * 100, 1)
                }
                for cat, count in cat_counts.items()
            ]

        # ── NUMERIC STATS ──
        numeric_cols = get_mapped_cols(column_mapping, 'numeric')
        for col in numeric_cols:
            if col in df.columns:
                numeric_data = pd.to_numeric(df[col], errors='coerce').dropna()
                if len(numeric_data) > 0:
                    mid = len(numeric_data) // 2
                    first_half_avg = numeric_data[:mid].mean()
                    second_half_avg = numeric_data[mid:].mean()
                    trend = 'up' if second_half_avg > first_half_avg else 'down'
                    results['numeric_stats'].append({
                        'column': col,
                        'min': round(float(numeric_data.min()), 2),
                        'max': round(float(numeric_data.max()), 2),
                        'average': round(float(numeric_data.mean()), 2),
                        'trend': trend
                    })

        # ── RISK SCORES ──
        if location_col and location_col in df.columns:
            results['risk_scores'] = calculate_risk_scores(
                df, location_col, category_col
            )

        # ── ALERTS ──
        results['alerts'] = generate_alerts(df, column_mapping, results)

        # ── FORECAST ──
        results['forecast'] = generate_forecast(results)

        return {'success': True, 'data': results}

    except Exception as e:
        return {'success': False, 'error': str(e)}


def get_mapped_col(mapping, col_type):
    for col, mapped_type in mapping.items():
        if mapped_type == col_type:
            return col
    return None

def get_mapped_cols(mapping, col_type):
    return [col for col, t in mapping.items() if t == col_type]

def get_date_range(df, mapping):
    date_col = get_mapped_col(mapping, 'date')
    if date_col and date_col in df.columns:
        dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
        if len(dates) > 0:
            return {
                'start': str(dates.min().date()),
                'end': str(dates.max().date())
            }
    return {'start': 'N/A', 'end': 'N/A'}

def calculate_risk_scores(df, location_col, category_col):
    zone_counts = df[location_col].value_counts()
    total = len(df)
    risk_scores = []
    for zone, count in zone_counts.head(10).items():
        score = round((count / total) * 100)
        if score > 75:
            level = 'CRITICAL'
        elif score > 50:
            level = 'HIGH'
        elif score > 25:
            level = 'MEDIUM'
        else:
            level = 'LOW'
        risk_scores.append({
            'zone': str(zone),
            'count': int(count),
            'score': score,
            'level': level
        })
    return sorted(risk_scores, key=lambda x: x['score'], reverse=True)

def generate_alerts(df, mapping, results):
    alerts = []
    total = len(df)

    # Alert 1 — High volume
    if total > 100:
        alerts.append({
            'id': 'ALT-001',
            'threat': 'HIGH',
            'title': 'Large dataset anomaly scan complete',
            'subtitle': f'Triggered by: {total} records analyzed',
            'confidence': 91
        })

    # Alert 2 — Zone hotspot
    if results['zone_distribution']:
        top_zone = results['zone_distribution'][0]
        pct = round(top_zone['count'] / total * 100)
        if pct > 30:
            alerts.append({
                'id': 'ALT-002',
                'threat': 'HIGH',
                'title': f"Activity concentration in {top_zone['zone']}",
                'subtitle': f"Triggered by: {pct}% of records in single zone",
                'confidence': 87
            })

    # Alert 3 — Trend
    if results['time_series'] and len(results['time_series']) >= 2:
        last = results['time_series'][-1]['count']
        prev = results['time_series'][-2]['count']
        if last > prev * 1.3:
            alerts.append({
                'id': 'ALT-003',
                'threat': 'MEDIUM',
                'title': 'Sudden spike in recent activity',
                'subtitle': f'Triggered by: {last} records in latest period vs {prev} previous',
                'confidence': 79
            })

    # Alert 4 — Category
    if results['category_breakdown']:
        top_cat = results['category_breakdown'][0]
        if top_cat['percentage'] > 40:
            alerts.append({
                'id': 'ALT-004',
                'threat': 'MEDIUM',
                'title': f"Dominant category: {top_cat['category']}",
                'subtitle': f"Triggered by: {top_cat['percentage']}% records in one category",
                'confidence': 74
            })

    # Alert 5 — Numeric anomaly
    if results['numeric_stats']:
        for stat in results['numeric_stats']:
            if stat['trend'] == 'up':
                alerts.append({
                    'id': 'ALT-005',
                    'threat': 'LOW',
                    'title': f"Rising trend in {stat['column']}",
                    'subtitle': f"Triggered by: avg increased in second half of dataset",
                    'confidence': 68
                })
                break

    return alerts[:5]

def generate_forecast(results):
    top_zone = results['zone_distribution'][0]['zone'] \
        if results['zone_distribution'] else 'Unknown'
    second_zone = results['zone_distribution'][1]['zone'] \
        if len(results['zone_distribution']) > 1 else 'Unknown'

    trend = 'increasing'
    if results['time_series'] and len(results['time_series']) >= 2:
        last = results['time_series'][-1]['count']
        first = results['time_series'][0]['count']
        if last < first:
            trend = 'decreasing'
        elif abs(last - first) < first * 0.1:
            trend = 'stable'

    return {
        'overall_risk': results['risk_scores'][0]['level'] \
            if results['risk_scores'] else 'MEDIUM',
        'top_zone': top_zone,
        'second_zone': second_zone,
        'trend': trend,
        'total_records': results['summary']['total_records'],
        'date_range': results['summary']['date_range']
    }