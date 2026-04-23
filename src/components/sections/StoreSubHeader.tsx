import React from 'react';
import ProductSortDropdown from '../molecules/ProductSortDropdown';
import { useBodyClass } from '../../utils/dom';

type Props = {
  categoryTitle: string;
  subCategoryTitle?: string;
  onFilterClick?: () => void;
  onSortClick?: () => void;
};

export default function StoreSubHeader({ categoryTitle, subCategoryTitle }: Props) {
  useBodyClass('no-scroll', false);

  return (
    <header className="store-subheader main pb-lg-responsive">
      <div className="store-subheader__title">
        <h1 className="type-3xl type-bold md:type-4xl lg:type-5xl m-0">{categoryTitle}</h1>
        {subCategoryTitle && (
          <p className="m-0">{subCategoryTitle}</p>
        )}
      </div>

      <div className="store-subheader__toolbar">
        {/* Filter button hidden temporarily */}
        <div className="store-subheader__right" style={{ marginLeft: 'auto' }}>
          <ProductSortDropdown className="store-subheader__sort" />
        </div>
      </div>

      {/* ProductFilterPanel hidden temporarily */}
    </header>
  );
}
