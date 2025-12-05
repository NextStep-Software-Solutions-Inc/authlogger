import { NextRequest, NextResponse } from 'next/server';
import { exportEventsToExcel } from '@/app/events/actions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');
        const userId = searchParams.get('userId');
        const eventType = searchParams.get('eventType');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        const result = await exportEventsToExcel({
            applicationId,
            userId: userId || undefined,
            eventType: eventType || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });

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
    } catch (error) {
        console.error('Error in export API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}