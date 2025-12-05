import { NextRequest, NextResponse } from 'next/server';
import { exportFullEventsToExcel, exportSimpleEventsToExcel, exportUserActivityToExcel } from '@/app/events/actions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');
        const userId = searchParams.get('userId');
        const eventType = searchParams.get('eventType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const exportType = searchParams.get('exportType') || 'full';

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        const filters = {
            applicationId,
            userId: userId || undefined,
            eventType: eventType || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        };

        let result;
        switch (exportType) {
            case 'user-activity':
                result = await exportUserActivityToExcel(filters);
                break;
            case 'simple':
                result = await exportSimpleEventsToExcel(filters);
                break;
            case 'full':
            default:
                result = await exportFullEventsToExcel(filters);
                break;
        }

        if (!result.success || !result.data) {
            return NextResponse.json({ error: result.error || 'Export failed' }, { status: 500 });
        }

        // Return the Excel file
        const { buffer, filename } = result.data;
        const uint8Array = new Uint8Array(buffer);
        const response = new NextResponse(uint8Array, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': uint8Array.length.toString(),
            },
        });

        return response;
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}