import React, { useEffect, useRef } from 'react';

/**
 * GooglePieChart3D Component
 * Renders a 3D pie chart using Google Charts API
 * Supports dark/light mode and detailed hover information
 */
const GooglePieChart3D = ({
  data,
  darkMode,
  title,
  getCategorySubscriptions,
  activeSubscriptions
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Google Charts if not already loaded
    if (!window.google || !window.google.visualization) {
      return;
    }

    // Prepare data for Google Charts
    const chartData = google.visualization.arrayToDataTable(
      [['Category', 'Amount']].concat(
        data.map(item => [item.name, item.value])
      )
    );

    // Chart options with 3D enabled
    const options = {
      title: title,
      titleTextStyle: {
        color: darkMode ? '#ffffff' : '#000000',
        fontSize: 18,
        bold: true
      },
      is3D: true,
      pieHole: 0,
      backgroundColor: 'transparent',
      legend: {
        position: 'bottom',
        textStyle: {
          color: darkMode ? '#ffffff' : '#000000',
          fontSize: 12
        }
      },
      tooltip: { trigger: 'none' },
      slices: {
        0: { offset: 0.05 },
        1: { offset: 0.05 },
        2: { offset: 0.05 },
        3: { offset: 0.05 },
        4: { offset: 0.05 },
        5: { offset: 0.05 }
      },
      chartArea: {
        left: 0,
        top: 40,
        width: '100%',
        height: '100%',
        backgroundColor: { fill: 'transparent' }
      },
      pieStartAngle: 0
    };

    const handleChartReady = () => {
      const chart = new google.visualization.PieChart(containerRef.current);

      google.visualization.events.addListener(chart, 'onmouseover', (e) => {
        const categoryName = chartData.getValue(e.row, 0);
        const categoryValue = chartData.getValue(e.row, 1);
        const subs = getCategorySubscriptions(activeSubscriptions, categoryName);

        let tooltipHtml = '<div style="padding: 16px; background: ';
        tooltipHtml += darkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)';
        tooltipHtml += '; border: 3px solid #0066ff; border-radius: 12px; color: ';
        tooltipHtml += darkMode ? '#ffffff' : '#000000';
        tooltipHtml += '; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 13px; max-width: 320px; box-shadow: 0 0 40px rgba(0, 102, 255, 0.8), 0 0 80px rgba(0, 102, 255, 0.4), 0 30px 100px rgba(0, 0, 0, 0.98);">';

        tooltipHtml += '<p style="margin: 0 0 12px 0; font-weight: bold; font-size: 15px;">' + categoryName + '</p>';
        tooltipHtml += '<p style="margin: 0 0 16px 0; font-weight: 600; color: #0099ff;">Total: $' + categoryValue.toFixed(2) + '/mo</p>';
        tooltipHtml += '<div style="border-top: 1px solid ' + (darkMode ? '#374151' : '#e5e7eb') + '; padding-top: 12px;">';
        tooltipHtml += '<p style="margin: 0 0 12px 0; font-weight: 600; font-size: 12px; color: ' + (darkMode ? '#9ca3af' : '#6b7280') + ';">' + subs.length + ' subscription' + (subs.length !== 1 ? 's' : '') + ':</p>';

        subs.forEach((sub) => {
          const borderColor = darkMode ? '#374151' : '#e5e7eb';
          const textColor = darkMode ? '#9ca3af' : '#6b7280';

          tooltipHtml += '<div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid ' + borderColor + '; display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;">';
          tooltipHtml += '<div style="flex: 1; min-width: 0;">';
          tooltipHtml += '<p style="margin: 0 0 4px 0; font-weight: 500; word-break: break-word;">' + sub.name + '</p>';
          tooltipHtml += '<p style="margin: 0; font-size: 12px; color: ' + textColor + ';">' + sub.cycle + '</p>';
          tooltipHtml += '</div>';
          tooltipHtml += '<div style="text-align: right; flex-shrink: 0;">';
          tooltipHtml += '<p style="margin: 0 0 4px 0; font-weight: 600; color: #0099ff;">$' + sub.monthlyCost.toFixed(2) + '/mo</p>';
          tooltipHtml += '<p style="margin: 0; font-size: 12px; color: ' + textColor + ';">(' + sub.cost + ')</p>';
          tooltipHtml += '</div>';
          tooltipHtml += '</div>';
        });

        tooltipHtml += '</div></div>';

        const tooltip = document.createElement('div');
        tooltip.innerHTML = tooltipHtml;
        tooltip.style.position = 'fixed';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.maxHeight = '400px';
        tooltip.style.overflowY = 'auto';
        tooltip.id = 'custom-pie-tooltip';

        document.body.appendChild(tooltip);

        const rect = containerRef.current.getBoundingClientRect();
        tooltip.style.left = (rect.left + 20) + 'px';
        tooltip.style.top = (rect.top + 20) + 'px';
      });

      google.visualization.events.addListener(chart, 'onmouseout', () => {
        const tooltip = document.getElementById('custom-pie-tooltip');
        if (tooltip) {
          tooltip.remove();
        }
      });

      chart.draw(chartData, options);
    };

    google.charts.setOnLoadCallback(handleChartReady);

  }, [data, darkMode, title, getCategorySubscriptions, activeSubscriptions]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    />
  );
};

export default GooglePieChart3D;
