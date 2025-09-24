import { NextRequest, NextResponse } from 'next/server';
import { exportEventsToExcel } from '@/app/events/actions';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const applicationId = searchParams.get('applicationId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!applicationId) {
            return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
        }

        const result = await exportEventsToExcel({
            applicationId,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
        });

        if (!result.success) {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

        // Return the Excel file
        const response = new NextResponse(result.buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="${result.filename}"`,
                'Content-Length': result.buffer.length.toString(),
            },
        });

        return response;
    } catch (error) {
        console.error('Error in export API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}