import React, { useEffect, useRef } from 'react';

/**
 * BillingCyclePieChart Component
 * Renders a 3D pie chart using Google Charts API for billing cycle breakdown
 * Supports dark/light mode and detailed hover information
 */
const BillingCyclePieChart = ({
  data,
  darkMode,
  title,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Load Google Charts if not already loaded
    if (!window.google || !window.google.visualization) {
      return;
    }

    // Prepare data for Google Charts
    const chartData = google.visualization.arrayToDataTable(
      [['Billing Cycle', 'Amount']].concat(
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
        2: { offset: 0.05 }
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

    // Function to remove tooltip
    const removeTooltip = () => {
      const tooltip = document.getElementById('custom-billing-cycle-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    };

    // Add scroll listener to remove tooltip on scroll
    const handleScroll = () => {
      removeTooltip();
    };
    window.addEventListener('scroll', handleScroll, true);

    const handleChartReady = () => {
      const chart = new google.visualization.PieChart(containerRef.current);

      google.visualization.events.addListener(chart, 'onmouseover', (e) => {
        const cycleName = chartData.getValue(e.row, 0);
        const cycleValue = chartData.getValue(e.row, 1);
        const cycleData = data[e.row];
        const count = cycleData.count || 0;

        let tooltipHtml = '<div style="padding: 16px; background: ';
        tooltipHtml += darkMode ? 'rgba(15, 23, 42, 1)' : 'rgba(255, 255, 255, 1)';
        tooltipHtml += '; border: 3px solid #0066ff; border-radius: 12px; color: ';
        tooltipHtml += darkMode ? '#ffffff' : '#000000';
        tooltipHtml += '; font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif; font-size: 13px; max-width: 320px; box-shadow: 0 0 40px rgba(0, 102, 255, 0.8), 0 0 80px rgba(0, 102, 255, 0.4), 0 30px 100px rgba(0, 0, 0, 0.98);">';

        tooltipHtml += '<p style="margin: 0 0 12px 0; font-weight: bold; font-size: 15px;">' + cycleName + '</p>';
        tooltipHtml += '<p style="margin: 0 0 16px 0; font-weight: 600; color: #0099ff;">Total: $' + cycleValue.toFixed(2) + '/mo</p>';
        tooltipHtml += '<div style="border-top: 1px solid ' + (darkMode ? '#374151' : '#e5e7eb') + '; padding-top: 12px;">';
        tooltipHtml += '<p style="margin: 0; font-weight: 600; font-size: 12px; color: ' + (darkMode ? '#9ca3af' : '#6b7280') + ';">' + count + ' subscription' + (count !== 1 ? 's' : '') + '</p>';
        tooltipHtml += '</div></div>';

        const tooltip = document.createElement('div');
        tooltip.innerHTML = tooltipHtml;
        tooltip.style.position = 'fixed';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '10000';
        tooltip.style.maxHeight = '400px';
        tooltip.style.overflowY = 'auto';
        tooltip.id = 'custom-billing-cycle-tooltip';

        document.body.appendChild(tooltip);

        const rect = containerRef.current.getBoundingClientRect();
        tooltip.style.left = (rect.left + 20) + 'px';
        tooltip.style.top = (rect.top + 20) + 'px';
      });

      google.visualization.events.addListener(chart, 'onmouseout', () => {
        removeTooltip();
      });

      chart.draw(chartData, options);
    };

    google.charts.setOnLoadCallback(handleChartReady);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      removeTooltip();
    };

  }, [data, darkMode, title]);

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

export default BillingCyclePieChart;
